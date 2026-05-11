import { app, BrowserWindow, dialog, ipcMain, Menu, shell } from "electron";
import { watch } from "node:fs";
import type { FSWatcher } from "node:fs";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { AppSettings, FileNode, MarkdownFile, WorkspaceSnapshot } from "./types.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const settingsPath = () => path.join(app.getPath("userData"), "settings.json");
let workspaceRoot: string | null = null;
let workspaceWatcher: FSWatcher | null = null;
let workspaceRefreshTimer: NodeJS.Timeout | null = null;

function appIconPath() {
  if (process.env.VITE_DEV_SERVER_URL) {
    return path.join(__dirname, "../assets/icon.png");
  }
  return path.join(__dirname, "../assets/icon.png");
}

const defaultSettings: AppSettings = {
  theme: "dark",
  sidebarCollapsed: false,
  rightPanelCollapsed: false,
  folderViewMode: "cards",
  documentWidth: "wide",
  folderSorts: {},
  customOrder: {},
  hiddenPaths: [],
  highlightedPaths: {},
  workspaceRoots: [],
  favoritePaths: [],
  railItems: {},
  showHidden: false,
  shortcuts: {
    openFolder: "Ctrl+O",
    closeTab: "Ctrl+W",
    previousTab: "Ctrl+,",
    nextTab: "Ctrl+.",
    back: "Alt+ArrowLeft",
    forward: "Alt+ArrowRight",
    toggleSidebar: "Ctrl+B",
    toggleRightPanel: "Ctrl+Shift+B",
    settings: "Ctrl+Shift+,"
  }
};

function createWindow() {
  const win = new BrowserWindow({
    width: 1440,
    height: 920,
    minWidth: 1100,
    minHeight: 720,
    title: "Karma",
    frame: false,
    icon: appIconPath(),
    backgroundColor: "#101114",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  });

  win.webContents.on("did-fail-load", (_event, errorCode, errorDescription, validatedURL) => {
    console.error("Renderer failed to load", { errorCode, errorDescription, validatedURL });
  });

  if (process.env.VITE_DEV_SERVER_URL) {
    void win.loadURL(process.env.VITE_DEV_SERVER_URL);
    win.webContents.openDevTools({ mode: "detach" });
  } else {
    const indexPath = app.isPackaged
      ? path.join(process.resourcesPath, "app.asar", "dist", "index.html")
      : path.join(__dirname, "../dist/index.html");
    void win.loadFile(indexPath);
  }
}

async function getTitleFromMarkdown(filePath: string) {
  try {
    const content = await fs.readFile(filePath, "utf8");
    const firstLine = content.split(/\r?\n/, 1)[0]?.trim() ?? "";
    const heading = firstLine.match(/^#\s+(.+)$/);
    return heading?.[1]?.trim() || path.basename(filePath, path.extname(filePath));
  } catch {
    return path.basename(filePath, path.extname(filePath));
  }
}

async function buildTree(root: string, current: string): Promise<FileNode[]> {
  const entries = await fs.readdir(current, { withFileTypes: true });
  const nodes: Array<FileNode | null> = await Promise.all(
    entries.map(async (entry) => {
      try {
        const absolutePath = path.join(current, entry.name);
        const relativePath = path.relative(root, absolutePath);
        const stat = await fs.stat(absolutePath);

        if (entry.isDirectory()) {
          const children = await buildTree(root, absolutePath);
          const preview = children.slice(0, 5).map((child) => child.title);
          return {
            id: absolutePath,
            type: "folder" as const,
            name: entry.name,
            title: entry.name,
            path: absolutePath,
            relativePath,
            createdAt: stat.birthtimeMs,
            modifiedAt: stat.mtimeMs,
            childCount: children.length,
            preview,
            children
          } satisfies FileNode;
        }

        if (entry.isFile() && path.extname(entry.name).toLowerCase() === ".md") {
          const title = await getTitleFromMarkdown(absolutePath);
          return {
            id: absolutePath,
            type: "file" as const,
            name: entry.name,
            title,
            path: absolutePath,
            relativePath,
            extension: ".md",
            createdAt: stat.birthtimeMs,
            modifiedAt: stat.mtimeMs
          } satisfies FileNode;
        }

        return null;
      } catch {
        return null;
      }
    })
  );

  return nodes
    .filter((node): node is FileNode => Boolean(node))
    .sort((a, b) => {
      if (a.type !== b.type) return a.type === "folder" ? -1 : 1;
      return a.title.localeCompare(b.title, "ko");
    });
}

function ensureInsideWorkspace(filePath: string) {
  if (!workspaceRoot) throw new Error("Workspace is not selected.");
  const resolvedRoot = path.resolve(workspaceRoot);
  const resolvedPath = path.resolve(filePath);
  if (!resolvedPath.startsWith(resolvedRoot)) {
    throw new Error("File is outside the selected workspace.");
  }
  return resolvedPath;
}

function broadcastWorkspaceSnapshot(snapshot: WorkspaceSnapshot) {
  BrowserWindow.getAllWindows().forEach((win) => {
    if (!win.isDestroyed()) win.webContents.send("workspace:changed", snapshot);
  });
}

function stopWorkspaceWatcher() {
  if (workspaceRefreshTimer) {
    clearTimeout(workspaceRefreshTimer);
    workspaceRefreshTimer = null;
  }
  workspaceWatcher?.close();
  workspaceWatcher = null;
}

function scheduleWorkspaceRefresh() {
  if (!workspaceRoot) return;
  if (workspaceRefreshTimer) clearTimeout(workspaceRefreshTimer);

  workspaceRefreshTimer = setTimeout(() => {
    workspaceRefreshTimer = null;
    if (!workspaceRoot) return;

    const root = workspaceRoot;
    void buildTree(root, root)
      .then((tree) => broadcastWorkspaceSnapshot({ rootPath: root, tree }))
      .catch((error) => {
        console.error("Failed to refresh workspace tree.", error);
      });
  }, 250);
}

function startWorkspaceWatcher(root: string) {
  stopWorkspaceWatcher();

  try {
    workspaceWatcher = watch(root, { recursive: true }, () => {
      scheduleWorkspaceRefresh();
    });
    workspaceWatcher.on("error", (error) => {
      console.error("Workspace watcher failed.", error);
      stopWorkspaceWatcher();
    });
  } catch (error) {
    console.error("Failed to start workspace watcher.", error);
  }
}

async function loadWorkspace(root: string): Promise<WorkspaceSnapshot> {
  workspaceRoot = root;
  const tree = await buildTree(workspaceRoot, workspaceRoot);
  startWorkspaceWatcher(workspaceRoot);
  return { rootPath: workspaceRoot, tree };
}

ipcMain.handle("workspace:open-folder", async () => {
  const result = await dialog.showOpenDialog({
    title: "Vault 열기",
    properties: ["openDirectory"]
  });

  if (result.canceled || !result.filePaths[0]) return null;

  return loadWorkspace(result.filePaths[0]);
});

ipcMain.handle("workspace:open-path", async (_event, rootPath: string): Promise<WorkspaceSnapshot> => {
  const stat = await fs.stat(rootPath);
  if (!stat.isDirectory()) throw new Error("Workspace path is not a directory.");
  return loadWorkspace(rootPath);
});

ipcMain.handle("workspace:read-file", async (_event, filePath: string): Promise<MarkdownFile> => {
  const safePath = ensureInsideWorkspace(filePath);
  const content = await fs.readFile(safePath, "utf8");
  const firstLine = content.split(/\r?\n/, 1)[0]?.trim() ?? "";
  const heading = firstLine.match(/^#\s+(.+)$/);
  return {
    path: safePath,
    title: heading?.[1]?.trim() || path.basename(safePath, path.extname(safePath)),
    content,
    relativePath: workspaceRoot ? path.relative(workspaceRoot, safePath) : path.basename(safePath),
    extension: path.extname(safePath)
  };
});

ipcMain.handle("settings:load", async (): Promise<AppSettings> => {
  try {
    const raw = await fs.readFile(settingsPath(), "utf8");
    return { ...defaultSettings, ...JSON.parse(raw) };
  } catch {
    return defaultSettings;
  }
});

ipcMain.handle("settings:save", async (_event, settings: AppSettings): Promise<AppSettings> => {
  const nextSettings = { ...defaultSettings, ...settings };
  await fs.mkdir(path.dirname(settingsPath()), { recursive: true });
  await fs.writeFile(settingsPath(), JSON.stringify(nextSettings, null, 2), "utf8");
  return nextSettings;
});

ipcMain.handle("window:minimize", (event) => {
  BrowserWindow.fromWebContents(event.sender)?.minimize();
});

ipcMain.handle("window:maximize", (event) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  if (!win) return;
  if (win.isMaximized()) win.unmaximize();
  else win.maximize();
});

ipcMain.handle("window:close", (event) => {
  BrowserWindow.fromWebContents(event.sender)?.close();
});

app.whenReady().then(() => {
  app.setAppUserModelId("com.karma.desktop");
  Menu.setApplicationMenu(null);
  createWindow();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  stopWorkspaceWatcher();
  if (process.platform !== "darwin") app.quit();
});

app.on("before-quit", () => {
  stopWorkspaceWatcher();
});

app.on("web-contents-created", (_event, contents) => {
  contents.setWindowOpenHandler(({ url }) => {
    void shell.openExternal(url);
    return { action: "deny" };
  });
});
