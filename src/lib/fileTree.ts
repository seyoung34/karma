import type { AppSettings, FileNode, FolderSortSetting, SortMode } from "../types";
import { defaultSort } from "./defaults";

export function collectNodes(nodes: FileNode[]): Map<string, FileNode> {
  const map = new Map<string, FileNode>();
  const walk = (items: FileNode[]) => {
    items.forEach((item) => {
      map.set(item.path, item);
      if (item.children) walk(item.children);
    });
  };
  walk(nodes);
  return map;
}

export function countMarkdown(nodes: FileNode[]) {
  let count = 0;
  const walk = (items: FileNode[]) => {
    items.forEach((item) => {
      if (item.type === "file") count += 1;
      if (item.children) walk(item.children);
    });
  };
  walk(nodes);
  return count;
}

export function getFolderSort(settings: AppSettings, folderPath: string): FolderSortSetting {
  return settings.folderSorts[folderPath] ?? defaultSort;
}

export function isHidden(settings: AppSettings, node: FileNode) {
  return settings.hiddenPaths.includes(node.path) || node.relativePath.split(/[\\/]/).some((part) => part.startsWith("."));
}

export function visibleNodes(nodes: FileNode[], settings: AppSettings) {
  if (settings.showHidden) return nodes;
  return nodes.filter((node) => !isHidden(settings, node));
}

export function sortNodes(nodes: FileNode[], settings: AppSettings, parentPath: string) {
  const sort = getFolderSort(settings, parentPath);
  const order = settings.customOrder[parentPath] ?? [];
  const direction = sort.direction === "asc" ? 1 : -1;
  const indexOf = (node: FileNode) => {
    const index = order.indexOf(node.path);
    return index === -1 ? Number.MAX_SAFE_INTEGER : index;
  };

  return [...visibleNodes(nodes, settings)].sort((a, b) => {
    let result = 0;
    if (sort.mode === "custom") {
      result = indexOf(a) - indexOf(b);
      if (result === 0) result = a.title.localeCompare(b.title, "ko");
      return result * direction;
    }

    if (sort.mode === "modified") result = a.modifiedAt - b.modifiedAt;
    else if (sort.mode === "created") result = a.createdAt - b.createdAt;
    else result = a.title.localeCompare(b.title, "ko");
    return result * direction;
  });
}

export function sortLabel(mode: SortMode) {
  if (mode === "custom") return "사용자설정순";
  if (mode === "modified") return "수정날짜순";
  if (mode === "created") return "생성날짜순";
  return "이름순";
}

export function formatDate(value: number) {
  return new Intl.DateTimeFormat("ko", { month: "short", day: "numeric" }).format(value);
}
