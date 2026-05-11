import { ArrowDownAZ, CalendarClock, Clock3, Eye, EyeOff, GripVertical, Highlighter, Star } from "lucide-react";
import type { AppSettings, FileNode, HighlightColor, SortMode } from "../types";
import { getFolderSort, isHidden } from "../lib/fileTree";

const sortItems: Array<{ mode: SortMode; label: string; Icon: typeof ArrowDownAZ }> = [
  { mode: "name", label: "이름순", Icon: ArrowDownAZ },
  { mode: "modified", label: "수정 날짜순", Icon: Clock3 },
  { mode: "created", label: "생성 날짜순", Icon: CalendarClock },
  { mode: "custom", label: "사용자 설정순", Icon: GripVertical }
];

const highlightItems: Array<{ color: HighlightColor; label: string }> = [
  { color: "yellow", label: "노랑" },
  { color: "blue", label: "파랑" },
  { color: "green", label: "초록" },
  { color: "pink", label: "핑크" },
  { color: "orange", label: "주황" }
];

type ContextMenuProps = {
  x: number;
  y: number;
  parentPath: string;
  node?: FileNode;
  settings: AppSettings;
  onSort: (parentPath: string, mode: SortMode) => void;
  onToggleHidden: (node: FileNode) => void;
  onSetHighlight: (node: FileNode, color: HighlightColor | null) => void;
  onToggleFavorite: (node: FileNode) => void;
};

export function ContextMenu({
  x,
  y,
  parentPath,
  node,
  settings,
  onSort,
  onToggleHidden,
  onSetHighlight,
  onToggleFavorite
}: ContextMenuProps) {
  const sort = getFolderSort(settings, parentPath);
  const highlightColor = node ? settings.highlightedPaths[node.path] : undefined;
  const isFavorite = node ? settings.favoritePaths.includes(node.path) : false;

  return (
    <div className="context-menu" style={{ left: x, top: y }} onClick={(event) => event.stopPropagation()}>
      {sortItems.map(({ mode, label, Icon }) => {
        const active = sort.mode === mode;
        const arrow = active && mode !== "custom" ? (sort.direction === "asc" ? "↑" : "↓") : "";
        return (
          <button key={mode} className={active ? "active" : ""} onClick={() => onSort(parentPath, mode)}>
            <Icon size={14} />
            <span>{label}</span>
            <b>{arrow}</b>
          </button>
        );
      })}
      {node && (
        <>
          <div className="context-separator" />
          <div className="context-submenu-item">
            <button
              className={highlightColor ? "active" : ""}
              onClick={() => onSetHighlight(node, highlightColor ? null : "yellow")}
            >
              <Highlighter size={14} className={highlightColor ? `node-highlight ${highlightColor}` : ""} />
              <span>강조</span>
              <b>{highlightColor ? "●" : ""}</b>
            </button>
            <div className="context-submenu">
              {highlightItems.map((item) => (
                <button
                  key={item.color}
                  className={`highlight-choice ${highlightColor === item.color ? "active" : ""}`}
                  title={item.label}
                  onClick={() => onSetHighlight(node, item.color)}
                >
                  <span className={`highlight-dot ${item.color}`} />
                  <span>{item.label}</span>
                </button>
              ))}
            </div>
          </div>
          <button onClick={() => onToggleHidden(node)}>
            {isHidden(settings, node) ? <Eye size={14} /> : <EyeOff size={14} />}
            <span>{isHidden(settings, node) ? "숨김 해제" : "숨김"}</span>
          </button>
          {node.type === "folder" && (
            <button className={isFavorite ? "active" : ""} onClick={() => onToggleFavorite(node)}>
              <Star size={14} />
              <span>{isFavorite ? "레일에서 제거" : "레일에 추가"}</span>
            </button>
          )}
        </>
      )}
    </div>
  );
}
