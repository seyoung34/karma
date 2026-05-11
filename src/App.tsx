import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ChromeBar } from "./components/ChromeBar";
import { CommandPalette } from "./components/CommandPalette";
import { ConfirmModal } from "./components/ConfirmModal";
import { ContextMenu } from "./components/ContextMenu";
import { DocumentView } from "./components/DocumentView";
import { FolderView } from "./components/FolderView";
import { HomeEmpty } from "./components/HomeEmpty";
import { RightPanel } from "./components/RightPanel";
import { SettingsModal } from "./components/SettingsModal";
import { Sidebar } from "./components/Sidebar";
import { WorkspaceRail } from "./components/WorkspaceRail";
import { defaultSettings, defaultShortcuts, defaultSort, rootFolderKey } from "./lib/defaults";
import { collectNodes, countMarkdown, getFolderSort, sortLabel, sortNodes } from "./lib/fileTree";
import { basenameWithoutExtension, linkCandidates, normalizeLinkName, safeDecode } from "./lib/markdown";
import { eventToShortcut } from "./lib/shortcuts";
import type { ActionId, AppSettings, DocumentWidth, FileNode, HighlightColor, RailItemSettings, SelectedFolder, SortMode, Tab, WorkspaceSnapshot } from "./types";
import type { CommandPaletteItem } from "./components/CommandPalette";

type DragState = {
  path: string;
  parentPath: string;
};

type DropTarget = {
  path: string;
  parentPath: string;
};

type ContextMenuState = {
  x: number;
  y: number;
  parentPath: string;
  node?: FileNode;
};

type ConfirmState = {
  title: string;
  message: string;
  confirmLabel: string;
  onConfirm: () => void;
};

type PersistedShortcutValue = string | string[] | undefined;

const documentWidthOptions: Array<{ value: DocumentWidth; label: string }> = [
  { value: "narrow", label: "좁게" },
  { value: "comfortable", label: "기본" },
  { value: "wide", label: "넓게" },
  { value: "full", label: "전체" }
];

function normalizeShortcut(value: PersistedShortcutValue, fallback: string) {
  if (Array.isArray(value)) return value[0] ?? fallback;
  return value || fallback;
}

function mergeSettings(loaded: AppSettings): AppSettings {
  const loadedShortcuts = loaded.shortcuts as Record<ActionId, PersistedShortcutValue>;
  const shortcuts = (Object.keys(defaultShortcuts) as ActionId[]).reduce((next, action) => {
    next[action] = normalizeShortcut(loadedShortcuts?.[action], defaultShortcuts[action]);
    return next;
  }, {} as Record<ActionId, string>);

  if (shortcuts.nextTab === "Ctrl+Tab") shortcuts.nextTab = defaultShortcuts.nextTab;
  if (shortcuts.nextTab === "ArrowDown") shortcuts.nextTab = defaultShortcuts.nextTab;
  if (shortcuts.previousTab === "Ctrl+Shift+Tab") shortcuts.previousTab = defaultShortcuts.previousTab;
  if (shortcuts.settings === "Ctrl+,") shortcuts.settings = defaultShortcuts.settings;

  return {
    ...defaultSettings,
    ...loaded,
    folderSorts: loaded.folderSorts ?? {},
    customOrder: loaded.customOrder ?? {},
    hiddenPaths: loaded.hiddenPaths ?? [],
    highlightedPaths: loaded.highlightedPaths ?? {},
    workspaceRoots: loaded.workspaceRoots ?? [],
    favoritePaths: loaded.favoritePaths ?? [],
    railItems: loaded.railItems ?? {},
    showHidden: loaded.showHidden ?? false,
    documentWidth: loaded.documentWidth ?? defaultSettings.documentWidth,
    shortcuts
  };
}

function BlankTabView() {
  return (
    <section className="blank-tab-view">
      <p>사이드 패널에서 폴더 또는 파일을 선택하세요</p>
    </section>
  );
}

function folderFromNode(node: FileNode): SelectedFolder {
  return { path: node.path, title: node.title, children: node.children ?? [] };
}

function isPathInside(path: string, root: string) {
  return path === root || path.startsWith(`${root}\\`) || path.startsWith(`${root}/`);
}

function labelFromPath(path: string) {
  const parts = path.split(/[\\/]/).filter(Boolean);
  return parts[parts.length - 1] ?? path;
}

function commandKeywords(...values: Array<string | undefined>) {
  return values.filter(Boolean).join(" ").toLowerCase();
}

export default function App() {
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  const [settingsLoaded, setSettingsLoaded] = useState(false);
  const [rootPath, setRootPath] = useState("");
  const [tree, setTree] = useState<FileNode[]>([]);
  const [tabs, setTabs] = useState<Tab[]>([]);
  const [activeTabId, setActiveTabId] = useState("");
  const [selectedFolder, setSelectedFolder] = useState<SelectedFolder | null>(null);
  const [status, setStatus] = useState("폴더를 열어 시작");
  const [openFolders, setOpenFolders] = useState<Set<string>>(new Set());
  const [dragState, setDragState] = useState<DragState | null>(null);
  const [dropTarget, setDropTarget] = useState<DropTarget | null>(null);
  const [focusedSidebarPath, setFocusedSidebarPath] = useState("");
  const [sidebarFocusSignal, setSidebarFocusSignal] = useState(0);
  const [centerFocused, setCenterFocused] = useState(false);
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
  const [confirmState, setConfirmState] = useState<ConfirmState | null>(null);
  const [centerOptionsOpen, setCenterOptionsOpen] = useState(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [recordingAction, setRecordingAction] = useState<ActionId | null>(null);
  const centerRef = useRef<HTMLElement>(null);

  const nodeMap = useMemo(() => collectNodes(tree), [tree]);
  const activeTab = tabs.find((tab) => tab.id === activeTabId);
  const activePath = activeTab?.file?.path ?? activeTab?.folder?.path;
  const rootParts = rootPath.split(/[\\/]/).filter(Boolean);
  const rootTitle = rootParts[rootParts.length - 1] ?? "Karma";
  const rootKey = rootPath || rootFolderKey;
  const sortedRoot = useMemo(() => sortNodes(tree, settings, rootKey), [tree, settings, rootKey]);

  useEffect(() => {
    void window.karma.loadSettings().then((loaded) => {
      setSettings(mergeSettings(loaded));
      setSettingsLoaded(true);
    });
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = settings.theme;
    if (!settingsLoaded) return;
    void window.karma.saveSettings(settings);
  }, [settings, settingsLoaded]);

  useEffect(() => {
    const close = () => setContextMenu(null);
    window.addEventListener("click", close);
    return () => window.removeEventListener("click", close);
  }, []);

  const updateSettings = useCallback((updater: (current: AppSettings) => AppSettings) => {
    setSettings((current) => updater(current));
  }, []);

  const requestConfirm = useCallback((next: ConfirmState) => {
    setConfirmState(next);
  }, []);

  const focusCenter = useCallback(() => {
    window.requestAnimationFrame(() => centerRef.current?.focus());
  }, []);

  const focusWorkspaceRail = useCallback(() => {
    setFocusedSidebarPath("");
    window.requestAnimationFrame(() => {
      const target =
        document.querySelector<HTMLButtonElement>(".workspace-rail .rail-entry.active") ??
        document.querySelector<HTMLButtonElement>(".workspace-rail [data-rail-index]") ??
        document.querySelector<HTMLButtonElement>(".workspace-rail .rail-action.primary");
      target?.focus();
    });
  }, []);

  const focusSidebarPath = useCallback((path: string) => {
    setFocusedSidebarPath(path);
    setSidebarFocusSignal((value) => value + 1);
    window.requestAnimationFrame(() => {
      document.querySelector<HTMLElement>(`[data-tree-path="${CSS.escape(path)}"]`)?.focus();
    });
  }, []);

  const sidebarVisiblePaths = useMemo(() => {
    const paths: string[] = [];
    const walk = (items: FileNode[]) => {
      items.forEach((node) => {
        paths.push(node.path);
        if (node.type === "folder" && openFolders.has(node.path)) {
          walk(sortNodes(node.children ?? [], settings, node.path));
        }
      });
    };
    walk(sortedRoot);
    return paths;
  }, [openFolders, settings, sortedRoot]);

  const focusSidebarRegion = useCallback(() => {
    const visibleSet = new Set(sidebarVisiblePaths);
    const nextPath =
      (activePath && visibleSet.has(activePath) ? activePath : "") ||
      (focusedSidebarPath && visibleSet.has(focusedSidebarPath) ? focusedSidebarPath : "") ||
      sidebarVisiblePaths[0] ||
      "";
    if (nextPath) focusSidebarPath(nextPath);
  }, [activePath, focusSidebarPath, focusedSidebarPath, sidebarVisiblePaths]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (!event.shiftKey || (event.key !== "ArrowLeft" && event.key !== "ArrowRight")) return;
      const target = document.activeElement instanceof HTMLElement
        ? document.activeElement
        : event.target instanceof HTMLElement
          ? event.target
          : null;
      if (!target) return;

      const inRail = Boolean(target.closest(".workspace-rail"));
      const inSidebar = Boolean(target.closest(".sidebar"));
      const inCenter = Boolean(target.closest(".center")) || centerFocused;
      if (!inRail && !inSidebar && !inCenter) return;

      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();

      if (event.key === "ArrowRight") {
        if (inRail) focusSidebarRegion();
        else if (inSidebar) focusCenter();
        return;
      }

      if (inCenter) focusSidebarRegion();
      else if (inSidebar) focusWorkspaceRail();
    };

    window.addEventListener("keydown", onKeyDown, true);
    return () => window.removeEventListener("keydown", onKeyDown, true);
  }, [centerFocused, focusCenter, focusSidebarRegion, focusWorkspaceRail]);

  const scrollCenterByPage = useCallback((direction: -1 | 1) => {
    const scrollTarget = centerRef.current?.querySelector<HTMLElement>(".document, .folder-view, .home-empty, .blank-tab-view");
    scrollTarget?.scrollBy({
      top: direction * scrollTarget.clientHeight * 0.65,
      behavior: "smooth"
    });
  }, []);

  const applyWorkspaceSnapshot = useCallback((snapshot: WorkspaceSnapshot) => {
    const nextNodeMap = collectNodes(snapshot.tree);

    setRootPath(snapshot.rootPath);
    setTree(snapshot.tree);
    setTabs((currentTabs) =>
      currentTabs
        .map((tab) => {
          if (!tab.folder) return tab;
          if (tab.folder.path === snapshot.rootPath) {
            return { ...tab, title: tab.folder.title, folder: { ...tab.folder, children: snapshot.tree } };
          }
          const nextFolder = nextNodeMap.get(tab.folder.path);
          if (!nextFolder || nextFolder.type !== "folder") return null;
          const folder = folderFromNode(nextFolder);
          return { ...tab, title: folder.title, folder };
        })
        .filter((tab): tab is Tab => Boolean(tab))
    );
    setSelectedFolder((current) => {
      if (!current) return current;
      if (current.path === snapshot.rootPath) {
        return { ...current, children: snapshot.tree };
      }
      const nextFolder = nextNodeMap.get(current.path);
      if (!nextFolder || nextFolder.type !== "folder") return null;
      return { path: nextFolder.path, title: nextFolder.title, children: nextFolder.children ?? [] };
    });
    setOpenFolders((current) => {
      const next = new Set<string>();
      current.forEach((path) => {
        const node = nextNodeMap.get(path);
        if (node?.type === "folder") next.add(path);
      });
      return next;
    });
    setFocusedSidebarPath((current) => current && !nextNodeMap.has(current) ? "" : current);
  }, []);

  const activateWorkspaceSnapshot = useCallback((snapshot: WorkspaceSnapshot, title = "Vault") => {
    applyWorkspaceSnapshot(snapshot);
    const rootFolder = { path: snapshot.rootPath, title, children: snapshot.tree };
    const rootTab = { id: `folder:${snapshot.rootPath}`, title: rootFolder.title, folder: rootFolder, history: [snapshot.rootPath], historyIndex: 0 };
    setTabs([rootTab]);
    setActiveTabId(rootTab.id);
    setSelectedFolder(rootFolder);
    setOpenFolders(new Set());
    focusSidebarPath(snapshot.tree[0]?.path ?? "");
    setStatus(`${countMarkdown(snapshot.tree)}개 Markdown 문서 로드`);
  }, [applyWorkspaceSnapshot, focusSidebarPath]);

  const openFolder = useCallback(async () => {
    const result = await window.karma.openFolder();
    if (!result) return;
    updateSettings((current) => ({
      ...current,
      workspaceRoots: Array.from(new Set([...current.workspaceRoots, result.rootPath]))
    }));
    activateWorkspaceSnapshot(result, "Vault");
    setStatus(`${countMarkdown(result.tree)}개 Markdown 문서 로드`);
  }, [activateWorkspaceSnapshot, updateSettings]);

  const openRootPath = useCallback(async (path: string) => {
    const result = await window.karma.openWorkspace(path);
    const parts = path.split(/[\\/]/).filter(Boolean);
    const title = parts[parts.length - 1] ?? "Vault";
    activateWorkspaceSnapshot(result, title);
  }, [activateWorkspaceSnapshot]);

  const openFavoritePath = useCallback(async (path: string, options?: { newTab?: boolean }) => {
    const roots = Array.from(new Set([rootPath, ...settings.workspaceRoots].filter(Boolean)));
    const root = roots
      .filter((candidate) => isPathInside(path, candidate))
      .sort((a, b) => b.length - a.length)[0];
    if (!root) return;

    const snapshot = root === rootPath ? { rootPath, tree } : await window.karma.openWorkspace(root);
    if (root !== rootPath) applyWorkspaceSnapshot(snapshot);
    const node = collectNodes(snapshot.tree).get(path);
    if (!node || node.type !== "folder") return;

    const folder = folderFromNode(node);
    const existing = tabs.find((tab) => tab.folder?.path === folder.path);
    if (existing && !options?.newTab) {
      setActiveTabId(existing.id);
    } else if (activeTab && !options?.newTab) {
      const nextHistory = activeTab.history.slice(0, activeTab.historyIndex + 1).concat(folder.path);
      setTabs((currentTabs) =>
        currentTabs.map((tab) =>
          tab.id === activeTab.id
            ? { ...tab, file: undefined, folder, title: folder.title, history: nextHistory, historyIndex: nextHistory.length - 1 }
            : tab
        )
      );
      setActiveTabId(activeTab.id);
    } else {
      const id = `folder:${folder.path}:${Date.now()}`;
      setTabs((currentTabs) => [...currentTabs, { id, title: folder.title, folder, history: [folder.path], historyIndex: 0 }]);
      setActiveTabId(id);
    }
    setSelectedFolder(folder);
    setStatus(`${folder.title} 폴더 열기`);
  }, [activeTab, applyWorkspaceSnapshot, rootPath, settings.workspaceRoots, tabs, tree]);

  const clearWorkspaceState = useCallback(() => {
    setRootPath("");
    setTree([]);
    setTabs([]);
    setActiveTabId("");
    setSelectedFolder(null);
    setOpenFolders(new Set());
    setFocusedSidebarPath("");
    setStatus("폴더를 열어 시작");
    window.requestAnimationFrame(() => {
      document.querySelector<HTMLButtonElement>(".workspace-rail .rail-action.primary")?.focus();
    });
  }, []);

  const removeWorkspaceRootNow = useCallback((path: string) => {
    updateSettings((current) => ({
      ...current,
      workspaceRoots: current.workspaceRoots.filter((root) => root !== path),
      favoritePaths: current.favoritePaths.filter((favorite) => (
        !isPathInside(favorite, path)
      )),
      railItems: Object.fromEntries(
        Object.entries(current.railItems).filter(([itemPath]) => (
          !isPathInside(itemPath, path)
        ))
      )
    }));
    if (rootPath && isPathInside(rootPath, path)) {
      clearWorkspaceState();
    }
  }, [clearWorkspaceState, rootPath, updateSettings]);

  const requestRemoveWorkspaceRoot = useCallback((path: string) => {
    requestConfirm({
      title: "워크스페이스를 삭제할까요?",
      message: "레일 목록에서만 제거됩니다. 로컬 폴더와 파일은 삭제되지 않습니다.",
      confirmLabel: "삭제",
      onConfirm: () => removeWorkspaceRootNow(path)
    });
  }, [removeWorkspaceRootNow, requestConfirm]);

  const requestRemoveFavorite = useCallback((path: string) => {
    requestConfirm({
      title: "레일에서 제거할까요?",
      message: "즐겨찾기 레일에서만 제거됩니다. 로컬 폴더와 파일은 삭제되지 않습니다.",
      confirmLabel: "제거",
      onConfirm: () => updateSettings((current) => ({
        ...current,
        favoritePaths: current.favoritePaths.filter((favorite) => favorite !== path),
        railItems: Object.fromEntries(Object.entries(current.railItems).filter(([itemPath]) => itemPath !== path))
      }))
    });
  }, [requestConfirm, updateSettings]);

  const updateRailItem = useCallback((path: string, patch: RailItemSettings) => {
    updateSettings((current) => ({
      ...current,
      railItems: {
        ...current.railItems,
        [path]: {
          ...current.railItems[path],
          ...patch
        }
      }
    }));
  }, [updateSettings]);

  const createBlankTab = useCallback(() => {
    const id = `blank:${Date.now()}`;
    setTabs((currentTabs) => [...currentTabs, { id, title: "새 탭", history: [], historyIndex: -1 }]);
    setActiveTabId(id);
    setSelectedFolder(null);
  }, []);

  const requestWindowClose = useCallback(() => {
    requestConfirm({
      title: "Karma를 닫을까요?",
      message: "현재 열려 있는 탭과 작업 화면이 닫힙니다.",
      confirmLabel: "닫기",
      onConfirm: () => {
        void window.karma.windowClose();
      }
    });
  }, [requestConfirm]);

  const openFile = useCallback(async (node: FileNode, options?: { newTab?: boolean }) => {
    if (node.type !== "file") return;
    const existing = tabs.find((tab) => tab.file?.path === node.path);
    const file = await window.karma.readFile(node.path);

    if (existing && !options?.newTab) {
      setActiveTabId(existing.id);
      setSelectedFolder(null);
      setStatus(`${file.title} 열림`);
      return;
    }

    if (!options?.newTab && activeTab) {
      const nextHistory = activeTab.history.slice(0, activeTab.historyIndex + 1).concat(file.path);
      setTabs((currentTabs) =>
        currentTabs.map((tab) =>
          tab.id === activeTab.id
            ? { ...tab, file, folder: undefined, title: file.title, history: nextHistory, historyIndex: nextHistory.length - 1 }
            : tab
        )
      );
      setActiveTabId(activeTab.id);
    } else {
      const id = `${file.path}:${Date.now()}`;
      setTabs((currentTabs) => [
        ...currentTabs,
        { id, title: file.title, file, history: [file.path], historyIndex: 0 }
      ]);
      setActiveTabId(id);
    }

    setSelectedFolder(null);
    setStatus(`${file.title} 열림`);
  }, [activeTab, tabs]);

  useEffect(() => {
    return window.karma.onWorkspaceChanged((snapshot) => {
      applyWorkspaceSnapshot(snapshot);
      setStatus(`${countMarkdown(snapshot.tree)}개 Markdown 문서 동기화`);

      const nextNodeMap = collectNodes(snapshot.tree);
      const openFilePaths = Array.from(new Set(tabs.map((tab) => tab.file?.path).filter(Boolean)));
      openFilePaths.forEach((filePath) => {
        if (!filePath) return;
        const node = nextNodeMap.get(filePath);
        if (node?.type !== "file") return;

        void window.karma.readFile(filePath).then((file) => {
          setTabs((currentTabs) =>
            currentTabs.map((tab) =>
              tab.file?.path === file.path
                ? { ...tab, file, title: file.title }
                : tab
            )
          );
        }).catch(() => {
          setStatus("파일 변경을 감지했지만 열린 문서를 다시 읽지 못함");
        });
      });
    });
  }, [applyWorkspaceSnapshot, tabs]);

  const selectFolder = useCallback((node: FileNode, options?: { newTab?: boolean }) => {
    if (node.type !== "folder") return;
    const folder = folderFromNode(node);
    const existing = tabs.find((tab) => tab.folder?.path === node.path);

    if (existing && !options?.newTab) {
      setActiveTabId(existing.id);
    } else if (activeTab && !options?.newTab) {
      const nextHistory = activeTab.history.slice(0, activeTab.historyIndex + 1).concat(folder.path);
      setTabs((currentTabs) =>
        currentTabs.map((tab) =>
          tab.id === activeTab.id
            ? { ...tab, file: undefined, folder, title: folder.title, history: nextHistory, historyIndex: nextHistory.length - 1 }
            : tab
        )
      );
      setActiveTabId(activeTab.id);
    } else {
      const id = `folder:${folder.path}:${Date.now()}`;
      setTabs((currentTabs) => [...currentTabs, { id, title: folder.title, folder, history: [folder.path], historyIndex: 0 }]);
      setActiveTabId(id);
    }
    setSelectedFolder(folder);
    setStatus(`${node.title} 폴더 선택`);
  }, [activeTab, tabs]);

  const toggleFolder = useCallback((node: FileNode, parentPath: string) => {
    setOpenFolders((current) => {
      const next = new Set(current);
      const siblings = parentPath === rootKey ? tree : nodeMap.get(parentPath)?.children ?? [];
      siblings.filter((item) => item.type === "folder" && item.path !== node.path).forEach((item) => next.delete(item.path));
      if (next.has(node.path)) next.delete(node.path);
      else next.add(node.path);
      return next;
    });
  }, [nodeMap, rootKey, tree]);

  const openSidebarFolder = useCallback((node: FileNode, parentPath: string) => {
    setOpenFolders((current) => {
      const next = new Set(current);
      const siblings = parentPath === rootKey ? tree : nodeMap.get(parentPath)?.children ?? [];
      siblings.filter((item) => item.type === "folder" && item.path !== node.path).forEach((item) => next.delete(item.path));
      next.add(node.path);
      return next;
    });
  }, [nodeMap, rootKey, tree]);

  const closeSidebarFolder = useCallback((node: FileNode) => {
    setOpenFolders((current) => {
      const next = new Set(current);
      next.delete(node.path);
      return next;
    });
  }, []);

  const collapseToParent = useCallback((parentPath: string) => {
    const parent = nodeMap.get(parentPath);
    if (!parent) return;
    setOpenFolders((current) => {
      const next = new Set(current);
      next.delete(parentPath);
      return next;
    });
    focusSidebarPath(parentPath);
    selectFolder(parent);
  }, [focusSidebarPath, nodeMap, selectFolder]);

  const closeTab = useCallback((id: string) => {
    setTabs((currentTabs) => {
      const index = currentTabs.findIndex((tab) => tab.id === id);
      const nextTabs = currentTabs.filter((tab) => tab.id !== id);
      if (id === activeTabId) {
        const nextActive = nextTabs[Math.max(0, index - 1)] ?? nextTabs[0];
        setActiveTabId(nextActive?.id ?? "");
        setSelectedFolder(nextActive?.folder ?? null);
      }
      return nextTabs;
    });
  }, [activeTabId]);

  const moveTab = useCallback((direction: -1 | 1) => {
    if (tabs.length === 0) return;
    const current = tabs.findIndex((tab) => tab.id === activeTabId);
    const next = current + direction;
    const nextTab = tabs[(next + tabs.length) % tabs.length];
    setActiveTabId(nextTab.id);
    setSelectedFolder(nextTab.folder ?? null);
  }, [activeTabId, tabs]);

  const navigateHistory = useCallback((direction: -1 | 1) => {
    if (!activeTab) return;
    const nextIndex = activeTab.historyIndex + direction;
    const nextPath = activeTab.history[nextIndex];
    const nextNode = nextPath ? nodeMap.get(nextPath) : null;
    if (!nextNode || nextIndex < 0 || nextIndex >= activeTab.history.length) return;

    if (nextNode.type === "folder") {
      const folder = folderFromNode(nextNode);
      setTabs((currentTabs) =>
        currentTabs.map((tab) =>
          tab.id === activeTab.id
            ? { ...tab, file: undefined, folder, title: folder.title, historyIndex: nextIndex }
            : tab
        )
      );
      setSelectedFolder(folder);
      setStatus(`${folder.title} 폴더 이동`);
      return;
    }

    void window.karma.readFile(nextNode.path).then((file) => {
      setTabs((currentTabs) =>
        currentTabs.map((tab) =>
          tab.id === activeTab.id
            ? { ...tab, file, folder: undefined, title: file.title, historyIndex: nextIndex }
            : tab
        )
      );
      setSelectedFolder(null);
      setStatus(`${file.title} 이동`);
    });
  }, [activeTab, nodeMap]);

  const openWikiLink = useCallback((target: string, newTab: boolean) => {
    const normalizedTarget = normalizeLinkName(safeDecode(target));
    const targetBasename = basenameWithoutExtension(target);
    const match = Array.from(nodeMap.values()).find((node) => {
      if (node.type !== "file") return false;
      const candidates = linkCandidates(node);
      return candidates.includes(normalizedTarget) || candidates.includes(targetBasename);
    });

    if (!match) {
      setStatus(`${target} 문서를 찾을 수 없음`);
      return;
    }

    void openFile(match, { newTab });
  }, [nodeMap, openFile]);

  const updateFolderSort = useCallback((parentPath: string, mode: SortMode) => {
    updateSettings((current) => {
      const currentSort = getFolderSort(current, parentPath);
      const isSameMode = currentSort.mode === mode;
      const direction = mode === "custom"
        ? "asc"
        : isSameMode && currentSort.direction === "asc"
          ? "desc"
          : "asc";
      return {
        ...current,
        folderSorts: {
          ...current.folderSorts,
          [parentPath]: { mode, direction }
        }
      };
    });
    setContextMenu(null);
  }, [updateSettings]);

  const toggleHidden = useCallback((node: FileNode) => {
    updateSettings((current) => {
      const exists = current.hiddenPaths.includes(node.path);
      return {
        ...current,
        hiddenPaths: exists
          ? current.hiddenPaths.filter((path) => path !== node.path)
          : [...current.hiddenPaths, node.path]
      };
    });
    setContextMenu(null);
  }, [updateSettings]);

  const setHighlight = useCallback((node: FileNode, color: HighlightColor | null) => {
    updateSettings((current) => {
      const nextHighlightedPaths = { ...current.highlightedPaths };
      if (color) nextHighlightedPaths[node.path] = color;
      else delete nextHighlightedPaths[node.path];
      return { ...current, highlightedPaths: nextHighlightedPaths };
    });
    setContextMenu(null);
  }, [updateSettings]);

  const toggleFavorite = useCallback((node: FileNode) => {
    if (node.type !== "folder") return;
    updateSettings((current) => {
      const exists = current.favoritePaths.includes(node.path);
      return {
        ...current,
        favoritePaths: exists
          ? current.favoritePaths.filter((path) => path !== node.path)
          : [...current.favoritePaths, node.path]
      };
    });
    setContextMenu(null);
  }, [updateSettings]);

  const dropNode = useCallback((targetPath: string, parentPath: string) => {
    if (!dragState || dragState.parentPath !== parentPath || dragState.path === targetPath) {
      setDropTarget(null);
      return;
    }
    const siblings = parentPath === rootKey ? tree : nodeMap.get(parentPath)?.children ?? [];
    const currentOrder = settings.customOrder[parentPath] ?? siblings.map((node) => node.path);
    const nextOrder = currentOrder.filter((path) => path !== dragState.path);
    const targetIndex = nextOrder.indexOf(targetPath);
    nextOrder.splice(targetIndex === -1 ? nextOrder.length : targetIndex, 0, dragState.path);
    updateSettings((current) => ({
      ...current,
      folderSorts: {
        ...current.folderSorts,
        [parentPath]: { mode: "custom", direction: defaultSort.direction }
      },
      customOrder: { ...current.customOrder, [parentPath]: nextOrder }
    }));
    setDragState(null);
    setDropTarget(null);
  }, [dragState, nodeMap, rootKey, settings.customOrder, tree, updateSettings]);

  const setShortcut = useCallback((action: ActionId, shortcut: string) => {
    updateSettings((current) => ({
      ...current,
      shortcuts: { ...current.shortcuts, [action]: shortcut }
    }));
  }, [updateSettings]);

  const runAction = useCallback((action: ActionId) => {
    if (action === "openFolder") void openFolder();
    if (action === "closeTab" && activeTabId) closeTab(activeTabId);
    if (action === "nextTab") moveTab(1);
    if (action === "previousTab") moveTab(-1);
    if (action === "back") navigateHistory(-1);
    if (action === "forward") navigateHistory(1);
    if (action === "toggleSidebar") updateSettings((current) => ({ ...current, sidebarCollapsed: !current.sidebarCollapsed }));
    if (action === "toggleRightPanel") updateSettings((current) => ({ ...current, rightPanelCollapsed: !current.rightPanelCollapsed }));
    if (action === "settings") setSettingsOpen(true);
  }, [activeTabId, closeTab, moveTab, navigateHistory, openFolder, updateSettings]);

  const commandPaletteItems = useMemo<CommandPaletteItem[]>(() => {
    const items: CommandPaletteItem[] = [];
    const workspacePaths = Array.from(new Set([rootPath, ...settings.workspaceRoots].filter(Boolean)));

    workspacePaths.forEach((path) => {
      const title = path === rootPath ? rootTitle : labelFromPath(path);
      items.push({
        id: `workspace:${path}`,
        title,
        subtitle: path,
        type: "workspace",
        keywords: commandKeywords(title, path, "workspace root"),
        run: () => {
          void openRootPath(path);
        }
      });
    });

    settings.favoritePaths.forEach((path) => {
      const title = settings.railItems[path]?.label?.trim() || labelFromPath(path);
      items.push({
        id: `favorite:${path}`,
        title,
        subtitle: path,
        type: "favorite",
        keywords: commandKeywords(title, path, "favorite folder"),
        run: (options) => {
          void openFavoritePath(path, options);
        }
      });
    });

    tabs.forEach((tab) => {
      const path = tab.file?.path ?? tab.folder?.path;
      items.push({
        id: `tab:${tab.id}`,
        title: tab.title,
        subtitle: path ? `열린 탭 · ${path}` : "열린 탭",
        type: "tab",
        keywords: commandKeywords(tab.title, path, "tab"),
        run: () => {
          setActiveTabId(tab.id);
          setSelectedFolder(tab.folder ?? null);
        }
      });
    });

    sidebarVisiblePaths.forEach((path) => {
      const node = nodeMap.get(path);
      if (!node) return;
      const type = node.type === "folder" ? "folder" : "file";
      items.push({
        id: `sidebar:${path}`,
        title: node.title,
        subtitle: node.relativePath || node.path,
        type,
        keywords: commandKeywords(node.title, node.name, node.relativePath, node.path, type),
        run: (options) => {
          if (node.type === "folder") selectFolder(node, options);
          else void openFile(node, options);
        }
      });
    });

    return items;
  }, [
    nodeMap,
    openFavoritePath,
    openFile,
    openRootPath,
    rootPath,
    rootTitle,
    selectFolder,
    settings.favoritePaths,
    settings.railItems,
    settings.workspaceRoots,
    sidebarVisiblePaths,
    tabs
  ]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (recordingAction) {
        event.preventDefault();
        const shortcut = eventToShortcut(event);
        if (!shortcut || shortcut === "Ctrl" || shortcut === "Alt" || shortcut === "Shift") return;
        const hasModifier = event.ctrlKey || event.metaKey || event.altKey || event.shiftKey;
        if (!hasModifier && shortcut.startsWith("Arrow")) return;
        if (shortcut) {
          setShortcut(recordingAction, shortcut);
          setRecordingAction(null);
        }
        return;
      }

      if ((event.ctrlKey || event.metaKey) && !event.shiftKey && !event.altKey && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setCommandPaletteOpen((open) => !open);
        return;
      }

      if ((event.ctrlKey || event.metaKey) && !event.shiftKey && !event.altKey && event.key.toLowerCase() === "p") {
        event.preventDefault();
        setCommandPaletteOpen(false);
        setSettingsOpen(false);
        setCenterOptionsOpen(false);
        focusCenter();
        return;
      }

      const shortcut = eventToShortcut(event);
      const action = (Object.entries(settings.shortcuts) as Array<[ActionId, string]>).find(([, value]) => value === shortcut)?.[0];
      if (!action) return;
      event.preventDefault();
      runAction(action);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [focusCenter, recordingAction, runAction, setShortcut, settings.shortcuts]);

  const currentSort = getFolderSort(settings, selectedFolder?.path ?? rootKey);

  return (
    <div className="app-shell">
      <ChromeBar
        settings={settings}
        tabs={tabs}
        activeTab={activeTab}
        activeTabId={activeTabId}
        onOpenFolder={openFolder}
        onOpenSettings={() => setSettingsOpen(true)}
        onToggleSidebar={() => updateSettings((current) => ({ ...current, sidebarCollapsed: !current.sidebarCollapsed }))}
        onToggleRightPanel={() => updateSettings((current) => ({ ...current, rightPanelCollapsed: !current.rightPanelCollapsed }))}
        onBack={() => navigateHistory(-1)}
        onForward={() => navigateHistory(1)}
        onNewTab={createBlankTab}
        onSelectTab={(tabId) => {
          const tab = tabs.find((item) => item.id === tabId);
          setActiveTabId(tabId);
          setSelectedFolder(tab?.folder ?? null);
        }}
        onCloseTab={closeTab}
        onWindowClose={requestWindowClose}
      />

      <main className={`workspace ${settings.sidebarCollapsed ? "sidebar-collapsed" : ""} ${settings.rightPanelCollapsed ? "right-collapsed" : ""}`}>
        <WorkspaceRail
          rootPath={rootPath}
          workspaceRoots={settings.workspaceRoots}
          favoritePaths={settings.favoritePaths}
          railItems={settings.railItems}
          onAddRoot={openFolder}
          onOpenRoot={(path) => {
            void openRootPath(path);
          }}
          onOpenFavorite={(path, options) => {
            void openFavoritePath(path, options);
          }}
          onRemoveRoot={requestRemoveWorkspaceRoot}
          onRemoveFavorite={requestRemoveFavorite}
          onUpdateRailItem={updateRailItem}
        />
        <Sidebar
          rootPath={rootPath}
          rootTitle={rootTitle}
          tree={tree}
          sortedRoot={sortedRoot}
          activePath={activePath}
          focusedPath={focusedSidebarPath}
          focusSignal={sidebarFocusSignal}
          openFolders={openFolders}
          settings={settings}
          draggedPath={dragState?.path ?? ""}
          dropTargetPath={dropTarget?.path ?? ""}
          onToggleShowHidden={() => updateSettings((current) => ({ ...current, showHidden: !current.showHidden }))}
          onFocusNode={setFocusedSidebarPath}
          onToggleFolder={toggleFolder}
          onOpenFolder={openSidebarFolder}
          onCloseFolder={closeSidebarFolder}
          onCollapseToParent={collapseToParent}
          onOpenFile={(node, options) => {
            void openFile(node, options);
          }}
          onSelectFolder={selectFolder}
          onContextMenu={(x, y, parentPath, node) => setContextMenu({ x, y, parentPath, node })}
          onDragStart={(path, parentPath) => setDragState({ path, parentPath })}
          onDragOverNode={(path, parentPath) => {
            if (dragState?.parentPath === parentPath) setDropTarget({ path, parentPath });
          }}
          onDragEnd={() => {
            setDragState(null);
            setDropTarget(null);
          }}
          onDropNode={dropNode}
          onFocusCenter={focusCenter}
        />

        <section
          ref={centerRef}
          tabIndex={-1}
          className={`center ${centerFocused ? "center-focused" : ""}`}
          onFocus={() => {
            setCenterFocused(true);
            setFocusedSidebarPath("");
          }}
          onBlur={() => setCenterFocused(false)}
          onKeyDown={(event) => {
            if (event.shiftKey && (event.key === "ArrowLeft" || event.key === "ArrowRight")) return;

            if (event.key === "ArrowLeft" && sidebarVisiblePaths.length > 0) {
              event.preventDefault();
              focusSidebarRegion();
              return;
            }
            if (event.key === "ArrowUp") {
              event.preventDefault();
              scrollCenterByPage(-1);
              return;
            }
            if (event.key === "ArrowDown") {
              event.preventDefault();
              scrollCenterByPage(1);
            }
          }}
        >
          <div className="absolute right-3 top-3 z-10">
            <button
              className="grid size-8 place-items-center rounded-md text-muted hover:bg-surface-2 hover:text-text focus-visible:outline focus-visible:outline-1 focus-visible:outline-accent"
              title="중앙 화면 설정"
              onClick={(event) => {
                event.stopPropagation();
                setCenterOptionsOpen((open) => !open);
              }}
            >
              ...
            </button>
            {centerOptionsOpen && (
              <div className="absolute right-0 top-10 w-40 rounded-lg border border-line bg-surface p-1 shadow-[0_18px_45px_rgb(0_0_0/0.4)]">
                <div className="px-2 py-1.5 text-xs text-faint">문서 폭</div>
                {documentWidthOptions.map((option) => (
                  <button
                    key={option.value}
                    className={`flex h-8 w-full items-center justify-between rounded-md px-2 text-left text-sm ${
                      settings.documentWidth === option.value ? "bg-surface-3 text-text" : "text-muted hover:bg-surface-2 hover:text-text"
                    }`}
                    onClick={() => {
                      updateSettings((current) => ({ ...current, documentWidth: option.value }));
                      setCenterOptionsOpen(false);
                      focusCenter();
                    }}
                  >
                    <span>{option.label}</span>
                    {settings.documentWidth === option.value && <span className="text-accent">✓</span>}
                  </button>
                ))}
              </div>
            )}
          </div>

          {selectedFolder ? (
            <FolderView
              selectedFolder={selectedFolder}
              settings={settings}
              onSetFolderViewMode={(mode) => updateSettings((current) => ({ ...current, folderViewMode: mode }))}
              onOpenFile={openFile}
              onSelectFolder={selectFolder}
            />
          ) : activeTab?.file ? (
            <DocumentView file={activeTab.file} width={settings.documentWidth} onWikiLink={openWikiLink} />
          ) : activeTab ? (
            <BlankTabView />
          ) : (
            <HomeEmpty onOpenFolder={openFolder} />
          )}
        </section>

        <RightPanel
          status={status}
          onClose={() => updateSettings((current) => ({ ...current, rightPanelCollapsed: true }))}
        />
      </main>

      <footer className="statusbar">
        <span>{status}</span>
        <span>정렬: {sortLabel(currentSort.mode)} {currentSort.mode === "custom" ? "" : currentSort.direction === "asc" ? "↑" : "↓"}</span>
      </footer>

      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          parentPath={contextMenu.parentPath}
          node={contextMenu.node}
          settings={settings}
          onSort={updateFolderSort}
          onToggleHidden={toggleHidden}
          onSetHighlight={setHighlight}
          onToggleFavorite={toggleFavorite}
        />
      )}

      {settingsOpen && (
        <SettingsModal
          settings={settings}
          recordingAction={recordingAction}
          onRecord={setRecordingAction}
          onClose={() => setSettingsOpen(false)}
        />
      )}

      {commandPaletteOpen && (
        <CommandPalette
          items={commandPaletteItems}
          onClose={() => setCommandPaletteOpen(false)}
        />
      )}

      {confirmState && (
        <ConfirmModal
          title={confirmState.title}
          message={confirmState.message}
          confirmLabel={confirmState.confirmLabel}
          onCancel={() => setConfirmState(null)}
          onConfirm={() => {
            const action = confirmState.onConfirm;
            setConfirmState(null);
            action();
          }}
        />
      )}
    </div>
  );
}
