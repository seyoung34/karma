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

export type WorkspaceSnapshot = {
  rootPath: string;
  tree: FileNode[];
};
