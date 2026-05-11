import type { ActionId, AppSettings, FolderSortSetting } from "../types";

export const rootFolderKey = "root";

export const defaultSort: FolderSortSetting = {
  mode: "name",
  direction: "asc"
};

export const defaultShortcuts: Record<ActionId, string> = {
  openFolder: "Ctrl+O",
  closeTab: "Ctrl+W",
  previousTab: "Ctrl+,",
  nextTab: "Ctrl+.",
  back: "Alt+ArrowLeft",
  forward: "Alt+ArrowRight",
  toggleSidebar: "Ctrl+B",
  toggleRightPanel: "Ctrl+Shift+B",
  settings: "Ctrl+Shift+,"
};

export const defaultSettings: AppSettings = {
  theme: "dark",
  sidebarCollapsed: false,
  rightPanelCollapsed: false,
  folderViewMode: "cards",
  folderSorts: {},
  customOrder: {},
  hiddenPaths: [],
  highlightedPaths: {},
  workspaceRoots: [],
  favoritePaths: [],
  railItems: {},
  showHidden: false,
  shortcuts: defaultShortcuts
};

export const actionLabels: Record<ActionId, string> = {
  openFolder: "폴더 열기",
  closeTab: "탭 닫기",
  previousTab: "이전 탭",
  nextTab: "다음 탭",
  back: "뒤로",
  forward: "앞으로",
  toggleSidebar: "좌측 패널",
  toggleRightPanel: "우측 패널",
  settings: "설정 열기"
};
