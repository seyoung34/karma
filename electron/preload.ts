import { contextBridge, ipcRenderer } from "electron";
import type { AppSettings, MarkdownFile, WorkspaceSnapshot } from "./types.js";

const api = {
  openFolder: (): Promise<WorkspaceSnapshot | null> =>
    ipcRenderer.invoke("workspace:open-folder"),
  openWorkspace: (rootPath: string): Promise<WorkspaceSnapshot> =>
    ipcRenderer.invoke("workspace:open-path", rootPath),
  readFile: (filePath: string): Promise<MarkdownFile> =>
    ipcRenderer.invoke("workspace:read-file", filePath),
  loadSettings: (): Promise<AppSettings> => ipcRenderer.invoke("settings:load"),
  saveSettings: (settings: AppSettings): Promise<AppSettings> =>
    ipcRenderer.invoke("settings:save", settings),
  onWorkspaceChanged: (callback: (snapshot: WorkspaceSnapshot) => void) => {
    const listener = (_event: Electron.IpcRendererEvent, snapshot: WorkspaceSnapshot) => callback(snapshot);
    ipcRenderer.on("workspace:changed", listener);
    return () => ipcRenderer.removeListener("workspace:changed", listener);
  },
  windowMinimize: (): Promise<void> => ipcRenderer.invoke("window:minimize"),
  windowMaximize: (): Promise<void> => ipcRenderer.invoke("window:maximize"),
  windowClose: (): Promise<void> => ipcRenderer.invoke("window:close")
};

contextBridge.exposeInMainWorld("karma", api);
