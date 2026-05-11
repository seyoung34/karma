export type NodeType = "folder" | "file";

export type FileNode = {
  id: string;
  type: NodeType;
  name: string;
  title: string;
  path: string;
  relativePath: string;
  extension?: string;
  createdAt: number;
  modifiedAt: number;
  childCount?: number;
  preview?: string[];
  children?: FileNode[];
};

export type MarkdownFile = {
  path: string;
  title: string;
  content: string;
  relativePath: string;
  extension: string;
};

export type AppSettings = {
  theme: "dark" | "light";
  sidebarCollapsed: boolean;
  rightPanelCollapsed: boolean;
  folderViewMode: "cards" | "list";
  documentWidth: DocumentWidth;
  folderSorts: Record<string, FolderSortSetting>;
  customOrder: Record<string, string[]>;
  hiddenPaths: string[];
  highlightedPaths: Record<string, HighlightColor>;
  workspaceRoots: string[];
  favoritePaths: string[];
  railItems: Record<string, RailItemSettings>;
  showHidden: boolean;
  shortcuts: Record<string, string>;
};

export type SortMode = "custom" | "name" | "modified" | "created";

export type SortDirection = "asc" | "desc";

export type DocumentWidth = "narrow" | "comfortable" | "wide" | "full";

export type HighlightColor = "yellow" | "blue" | "green" | "pink" | "orange";

export type RailItemColor = "slate" | "blue" | "green" | "pink" | "orange";

export type RailItemSettings = {
  label?: string;
  color?: RailItemColor;
};

export type FolderSortSetting = {
  mode: SortMode;
  direction: SortDirection;
};

export type Tab = {
  id: string;
  title: string;
  file?: MarkdownFile;
  folder?: SelectedFolder;
  history: string[];
  historyIndex: number;
};

export type SelectedFolder = {
  path: string;
  title: string;
  children: FileNode[];
};

export type WorkspaceSnapshot = {
  rootPath: string;
  tree: FileNode[];
};

export type ActionId =
  | "openFolder"
  | "closeTab"
  | "previousTab"
  | "nextTab"
  | "back"
  | "forward"
  | "toggleSidebar"
  | "toggleRightPanel"
  | "settings";

export type KarmaApi = {
  openFolder: () => Promise<WorkspaceSnapshot | null>;
  openWorkspace: (rootPath: string) => Promise<WorkspaceSnapshot>;
  readFile: (filePath: string) => Promise<MarkdownFile>;
  loadSettings: () => Promise<AppSettings>;
  saveSettings: (settings: AppSettings) => Promise<AppSettings>;
  onWorkspaceChanged: (callback: (snapshot: WorkspaceSnapshot) => void) => () => void;
  windowMinimize: () => Promise<void>;
  windowMaximize: () => Promise<void>;
  windowClose: () => Promise<void>;
};

declare global {
  interface Window {
    karma: KarmaApi;
  }
}
