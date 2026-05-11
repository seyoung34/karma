import { Eye, EyeOff, FileText, Folder, FolderOpen, GripVertical } from "lucide-react";
import { memo, MouseEvent, useEffect, useMemo, useRef } from "react";
import type { AppSettings, FileNode } from "../types";
import { rootFolderKey } from "../lib/defaults";
import { getFolderSort, isHidden, sortNodes } from "../lib/fileTree";
import { IconButton } from "./IconButton";

type VisibleNode = {
  node: FileNode;
  parentPath: string;
  depth: number;
};

function flattenVisibleNodes(nodes: FileNode[], settings: AppSettings, openFolders: Set<string>, parentPath: string, depth = 0): VisibleNode[] {
  const result: VisibleNode[] = [];
  const sortedCache = new Map<string, FileNode[]>();

  const sortedChildren = (node: FileNode) => {
    const cached = sortedCache.get(node.path);
    if (cached) return cached;
    const sorted = sortNodes(node.children ?? [], settings, node.path);
    sortedCache.set(node.path, sorted);
    return sorted;
  };

  const walk = (items: FileNode[], currentParentPath: string, currentDepth: number) => {
    items.forEach((node) => {
      result.push({ node, parentPath: currentParentPath, depth: currentDepth });
      if (node.type === "folder" && openFolders.has(node.path)) {
        walk(sortedChildren(node), node.path, currentDepth + 1);
      }
    });
  };

  walk(nodes, parentPath, depth);
  return result;
}

const TreeNode = memo(function TreeNode({
  item,
  activePath,
  focusedPath,
  focusSignal,
  isOpen,
  hidden,
  highlightColor,
  draggedPath,
  dropTargetPath,
  onFocusNode,
  onToggleFolder,
  onOpenFolder,
  onCloseFolder,
  onCollapseToParent,
  onOpenFile,
  onSelectFolder,
  onContextMenu,
  onDragStart,
  onDragOverNode,
  onDragEnd,
  onDropNode
}: {
  item: VisibleNode;
  activePath?: string;
  focusedPath?: string;
  focusSignal: number;
  isOpen: boolean;
  hidden: boolean;
  highlightColor?: string;
  draggedPath: string;
  dropTargetPath: string;
  onFocusNode: (path: string) => void;
  onToggleFolder: (node: FileNode, parentPath: string) => void;
  onOpenFolder: (node: FileNode, parentPath: string) => void;
  onCloseFolder: (node: FileNode) => void;
  onCollapseToParent: (parentPath: string) => void;
  onOpenFile: (node: FileNode, options?: { newTab?: boolean }) => void;
  onSelectFolder: (node: FileNode, options?: { newTab?: boolean }) => void;
  onContextMenu: (x: number, y: number, parentPath: string, node?: FileNode) => void;
  onDragStart: (path: string, parentPath: string) => void;
  onDragOverNode: (targetPath: string, parentPath: string) => void;
  onDragEnd: () => void;
  onDropNode: (targetPath: string, parentPath: string) => void;
}) {
  const { node, parentPath, depth } = item;
  const isActive = activePath === node.path;
  const isFocused = focusedPath === node.path;
  const isDropTarget = dropTargetPath === node.path;
  const rowRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (isFocused) rowRef.current?.focus();
  }, [focusSignal, isFocused]);

  const sharedProps = {
    ref: rowRef,
    draggable: true,
    tabIndex: isFocused ? 0 : -1,
    "data-tree-path": node.path,
    onFocus: () => onFocusNode(node.path),
    onDragStart: () => onDragStart(node.path, parentPath),
    onDragEnd,
    onDragOver: (event: React.DragEvent) => {
      event.preventDefault();
      onDragOverNode(node.path, parentPath);
    },
    onDrop: () => onDropNode(node.path, parentPath),
    onContextMenu: (event: MouseEvent) => {
      event.preventDefault();
      onContextMenu(event.clientX, event.clientY, parentPath, node);
    }
  };

  if (node.type === "folder") {
    return (
      <button
        className={`tree-row folder-row ${hidden ? "hidden-node" : ""} ${isFocused ? "focused" : ""} ${isDropTarget ? "drop-target" : ""} ${draggedPath === node.path ? "dragging" : ""}`}
        style={{ paddingLeft: 12 + depth * 14 }}
        {...sharedProps}
        onClick={(event: MouseEvent) => {
          onToggleFolder(node, parentPath);
          onSelectFolder(node, { newTab: event.ctrlKey || event.metaKey });
        }}
      >
        <GripVertical size={12} className="drag-handle" />
        {isOpen ? <FolderOpen size={15} className={highlightColor ? `node-highlight ${highlightColor}` : ""} /> : <Folder size={15} className={highlightColor ? `node-highlight ${highlightColor}` : ""} />}
        <span>{node.title}</span>
        <small>{node.childCount ?? 0}</small>
      </button>
    );
  }

  return (
    <button
      className={`tree-row file-row ${isActive ? "active" : ""} ${hidden ? "hidden-node" : ""} ${isFocused ? "focused" : ""} ${isDropTarget ? "drop-target" : ""} ${draggedPath === node.path ? "dragging" : ""}`}
      style={{ paddingLeft: 12 + depth * 14 }}
      {...sharedProps}
      onClick={(event: MouseEvent) => onOpenFile(node, { newTab: event.ctrlKey || event.metaKey })}
    >
      <GripVertical size={12} className="drag-handle" />
      <FileText size={14} className={highlightColor ? `node-highlight ${highlightColor}` : ""} />
      <span>{node.title}</span>
    </button>
  );
}, (previous, next) => (
  previous.item.node === next.item.node &&
  previous.item.parentPath === next.item.parentPath &&
  previous.item.depth === next.item.depth &&
  previous.activePath === next.activePath &&
  previous.focusedPath === next.focusedPath &&
  previous.focusSignal === next.focusSignal &&
  previous.isOpen === next.isOpen &&
  previous.hidden === next.hidden &&
  previous.highlightColor === next.highlightColor &&
  previous.draggedPath === next.draggedPath &&
  previous.dropTargetPath === next.dropTargetPath
));

export function Sidebar({
  rootPath,
  rootTitle,
  tree,
  sortedRoot,
  activePath,
  focusedPath,
  focusSignal,
  openFolders,
  settings,
  draggedPath,
  dropTargetPath,
  onToggleShowHidden,
  onFocusNode,
  onToggleFolder,
  onOpenFolder,
  onCloseFolder,
  onCollapseToParent,
  onOpenFile,
  onSelectFolder,
  onContextMenu,
  onDragStart,
  onDragOverNode,
  onDragEnd,
  onDropNode,
  onFocusCenter
}: {
  rootPath: string;
  rootTitle: string;
  tree: FileNode[];
  sortedRoot: FileNode[];
  activePath?: string;
  focusedPath?: string;
  focusSignal: number;
  openFolders: Set<string>;
  settings: AppSettings;
  draggedPath: string;
  dropTargetPath: string;
  onToggleShowHidden: () => void;
  onFocusNode: (path: string) => void;
  onToggleFolder: (node: FileNode, parentPath: string) => void;
  onOpenFolder: (node: FileNode, parentPath: string) => void;
  onCloseFolder: (node: FileNode) => void;
  onCollapseToParent: (parentPath: string) => void;
  onOpenFile: (node: FileNode, options?: { newTab?: boolean }) => void;
  onSelectFolder: (node: FileNode, options?: { newTab?: boolean }) => void;
  onContextMenu: (x: number, y: number, parentPath: string, node?: FileNode) => void;
  onDragStart: (path: string, parentPath: string) => void;
  onDragOverNode: (targetPath: string, parentPath: string) => void;
  onDragEnd: () => void;
  onDropNode: (targetPath: string, parentPath: string) => void;
  onFocusCenter: () => void;
}) {
  const rootSort = getFolderSort(settings, rootPath || rootFolderKey);
  const visibleNodes = useMemo(
    () => flattenVisibleNodes(sortedRoot, settings, openFolders, rootPath || rootFolderKey),
    [openFolders, rootPath, settings, sortedRoot]
  );

  const focusByOffset = (offset: number) => {
    if (visibleNodes.length === 0) return;
    const rawIndex = visibleNodes.findIndex((item) => item.node.path === focusedPath);
    const currentIndex = rawIndex === -1 ? (offset > 0 ? -1 : 0) : rawIndex;
    const nextIndex = Math.min(visibleNodes.length - 1, Math.max(0, currentIndex + offset));
    onFocusNode(visibleNodes[nextIndex].node.path);
  };

  const activateFocused = () => {
    const item = visibleNodes.find((entry) => entry.node.path === focusedPath) ?? visibleNodes[0];
    if (!item) return;
    if (item.node.type === "folder") {
      onToggleFolder(item.node, item.parentPath);
      onSelectFolder(item.node);
      return;
    }
    onOpenFile(item.node);
    onFocusCenter();
  };

  const activateRight = (newTab = false) => {
    const item = visibleNodes.find((entry) => entry.node.path === focusedPath) ?? visibleNodes[0];
    if (!item) return;
    if (item.node.type === "folder") {
      if (!openFolders.has(item.node.path)) onOpenFolder(item.node, item.parentPath);
      onSelectFolder(item.node, { newTab });
      return;
    }
    onOpenFile(item.node, { newTab });
    onFocusCenter();
  };

  const activateLeft = () => {
    const item = visibleNodes.find((entry) => entry.node.path === focusedPath) ?? visibleNodes[0];
    if (!item) return;
    if (item.node.type === "folder" && openFolders.has(item.node.path)) {
      onCloseFolder(item.node);
      onSelectFolder(item.node);
      return;
    }
    if (item.parentPath === (rootPath || rootFolderKey)) return;
    onCollapseToParent(item.parentPath);
  };

  return (
    <aside
      className="sidebar"
      onKeyDown={(event) => {
        if (event.shiftKey && (event.key === "ArrowLeft" || event.key === "ArrowRight")) return;

        if (event.key === "ArrowDown") {
          event.preventDefault();
          focusByOffset(1);
        }
        if (event.key === "ArrowUp") {
          event.preventDefault();
          focusByOffset(-1);
        }
        if (event.key === "Enter") {
          event.preventDefault();
          activateFocused();
        }
        if (event.key === "ArrowRight") {
          event.preventDefault();
          activateRight(event.ctrlKey || event.metaKey);
        }
        if (event.key === "ArrowLeft") {
          event.preventDefault();
          activateLeft();
        }
      }}
    >
      <div className="sidebar-head">
        <div>
          <strong>{rootPath ? rootTitle : "Vault"}</strong>
          <span>{rootPath ? `${rootSort.mode} · ${rootSort.direction}` : "폴더를 선택하세요"}</span>
        </div>
        <IconButton title={settings.showHidden ? "숨김 항목 숨기기" : "숨김 항목 표시"} onClick={onToggleShowHidden}>
          {settings.showHidden ? <Eye size={16} /> : <EyeOff size={16} />}
        </IconButton>
      </div>
      <div className="tree">
        {tree.length === 0 ? (
          <div className="empty-note">Vault를 열면 폴더 구조가 표시됩니다.</div>
        ) : (
          visibleNodes.map((item) => (
            <TreeNode
              key={item.node.path}
              item={item}
              activePath={activePath}
              focusedPath={focusedPath}
              focusSignal={focusSignal}
              isOpen={openFolders.has(item.node.path)}
              hidden={isHidden(settings, item.node)}
              highlightColor={settings.highlightedPaths[item.node.path]}
              draggedPath={draggedPath}
              dropTargetPath={dropTargetPath}
              onFocusNode={onFocusNode}
              onToggleFolder={onToggleFolder}
              onOpenFolder={onOpenFolder}
              onCloseFolder={onCloseFolder}
              onCollapseToParent={onCollapseToParent}
              onOpenFile={onOpenFile}
              onSelectFolder={onSelectFolder}
              onContextMenu={onContextMenu}
              onDragStart={onDragStart}
              onDragOverNode={onDragOverNode}
              onDragEnd={onDragEnd}
              onDropNode={onDropNode}
            />
          ))
        )}
      </div>
    </aside>
  );
}
