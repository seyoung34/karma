import { FolderPlus, Plus, Sparkles } from "lucide-react";
import { KeyboardEvent, MouseEvent, useEffect, useMemo, useState } from "react";
import type { RailItemColor, RailItemSettings } from "../types";

type RailKind = "root" | "favorite";

type RailMenu = {
  x: number;
  y: number;
  path: string;
  kind: RailKind;
};

type RailItem = {
  kind: RailKind;
  path: string;
};

const railColors: Array<{ color: RailItemColor; label: string }> = [
  { color: "slate", label: "기본" },
  { color: "blue", label: "파랑" },
  { color: "green", label: "초록" },
  { color: "pink", label: "핑크" },
  { color: "orange", label: "주황" }
];

function labelFromPath(path: string) {
  const parts = path.split(/[\\/]/).filter(Boolean);
  return parts[parts.length - 1] ?? "Root";
}

function fallbackLabel(path: string) {
  return labelFromPath(path).slice(0, 2).toUpperCase();
}

function railLabel(path: string, settings?: RailItemSettings) {
  return (settings?.label?.trim() || fallbackLabel(path)).slice(0, 4);
}

export function WorkspaceRail({
  rootPath,
  workspaceRoots,
  favoritePaths,
  railItems,
  onAddRoot,
  onOpenRoot,
  onOpenFavorite,
  onRemoveRoot,
  onRemoveFavorite,
  onUpdateRailItem
}: {
  rootPath: string;
  workspaceRoots: string[];
  favoritePaths: string[];
  railItems: Record<string, RailItemSettings>;
  onAddRoot: () => void;
  onOpenRoot: (path: string) => void;
  onOpenFavorite: (path: string, options?: { newTab?: boolean }) => void;
  onRemoveRoot: (path: string) => void;
  onRemoveFavorite: (path: string) => void;
  onUpdateRailItem: (path: string, patch: RailItemSettings) => void;
}) {
  const [menu, setMenu] = useState<RailMenu | null>(null);
  const items = useMemo<RailItem[]>(() => [
    ...workspaceRoots.map((path) => ({ kind: "root" as const, path })),
    ...favoritePaths.map((path) => ({ kind: "favorite" as const, path }))
  ], [favoritePaths, workspaceRoots]);

  useEffect(() => {
    const close = () => setMenu(null);
    window.addEventListener("click", close);
    return () => window.removeEventListener("click", close);
  }, []);

  const openItem = (item: RailItem, options?: { newTab?: boolean }) => {
    if (item.kind === "root") onOpenRoot(item.path);
    else onOpenFavorite(item.path, options);
  };

  const removeItem = (item: RailItem) => {
    if (item.kind === "root") onRemoveRoot(item.path);
    else onRemoveFavorite(item.path);
  };

  const openMenu = (event: MouseEvent, item: RailItem) => {
    event.preventDefault();
    event.stopPropagation();
    setMenu({ x: event.clientX, y: event.clientY, path: item.path, kind: item.kind });
  };

  const focusItemByOffset = (event: KeyboardEvent, offset: number) => {
    const currentIndex = Number((event.currentTarget as HTMLElement).dataset.railIndex ?? 0);
    const nextIndex = Math.min(items.length - 1, Math.max(0, currentIndex + offset));
    const nextButton = document.querySelector<HTMLButtonElement>(`[data-rail-index="${nextIndex}"]`);
    nextButton?.focus();
  };

  const handleKeyDown = (event: KeyboardEvent, item: RailItem) => {
    if (event.shiftKey && (event.key === "ArrowLeft" || event.key === "ArrowRight")) return;

    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      focusItemByOffset(event, event.key === "ArrowDown" ? 1 : -1);
      return;
    }

    if (event.key === "Enter" || event.key === "ArrowRight") {
      event.preventDefault();
      openItem(item, { newTab: event.key === "ArrowRight" && (event.ctrlKey || event.metaKey) });
      return;
    }

    if (event.key === "Delete" || event.key === "Backspace") {
      event.preventDefault();
      removeItem(item);
    }
  };

  const renderRailButton = (item: RailItem, railIndex: number) => {
    const itemSettings = railItems[item.path];
    const color = itemSettings?.color ?? "slate";
    const label = railLabel(item.path, itemSettings);
    const isRoot = item.kind === "root";
    return (
      <button
        key={`${item.kind}:${item.path}`}
        data-rail-index={railIndex}
        className={`rail-entry rail-color-${color} ${isRoot && item.path === rootPath ? "active" : ""}`}
        title={item.path}
        onClick={() => openItem(item)}
        onContextMenu={(event) => openMenu(event, item)}
        onKeyDown={(event) => handleKeyDown(event, item)}
      >
        <span>{label}</span>
      </button>
    );
  };

  return (
    <aside className="workspace-rail" aria-label="워크스페이스 바로가기">
      <button className="rail-action primary" title="Root 폴더 추가" onClick={onAddRoot}>
        <Plus size={17} />
      </button>

      <div className="rail-section">
        {workspaceRoots.map((path, index) => renderRailButton({ kind: "root", path }, index))}
      </div>

      {favoritePaths.length > 0 && <div className="rail-divider" />}

      <div className="rail-section">
        {favoritePaths.map((path, index) => renderRailButton({ kind: "favorite", path }, workspaceRoots.length + index))}
      </div>

      <div className="rail-spacer" />
      <button className="rail-action muted" title="추후 도구 영역">
        <Sparkles size={16} />
      </button>
      <button className="rail-action muted" title="폴더 즐겨찾기">
        <FolderPlus size={16} />
      </button>

      {menu && (
        <div className="rail-context-menu rail-edit-menu" style={{ left: menu.x, top: menu.y }} onClick={(event) => event.stopPropagation()}>
          <label className="rail-edit-label">
            <span>표시 이름</span>
            <input
              value={railItems[menu.path]?.label ?? ""}
              maxLength={4}
              placeholder={fallbackLabel(menu.path)}
              onChange={(event) => onUpdateRailItem(menu.path, { label: event.target.value.slice(0, 4) })}
              onKeyDown={(event) => event.stopPropagation()}
            />
          </label>
          <div className="rail-color-row" aria-label="레일 색상">
            {railColors.map((item) => (
              <button
                key={item.color}
                className={`rail-color-choice rail-color-${item.color} ${((railItems[menu.path]?.color ?? "slate") === item.color) ? "active" : ""}`}
                title={item.label}
                onClick={() => onUpdateRailItem(menu.path, { color: item.color })}
              >
                <span />
              </button>
            ))}
          </div>
          <button
            onClick={() => {
              removeItem(menu);
              setMenu(null);
            }}
          >
            {menu.kind === "root" ? "워크스페이스에서 삭제" : "레일에서 제거"}
          </button>
        </div>
      )}
    </aside>
  );
}
