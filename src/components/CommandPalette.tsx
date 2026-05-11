import { FileText, Folder, HardDrive, Search, Star, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

export type CommandPaletteItem = {
  id: string;
  title: string;
  subtitle?: string;
  type: "file" | "folder" | "workspace" | "favorite" | "tab";
  keywords: string;
  run: (options?: { newTab?: boolean }) => void;
};

const typeLabels: Record<CommandPaletteItem["type"], string> = {
  file: "File",
  folder: "Folder",
  workspace: "Workspace",
  favorite: "Favorite",
  tab: "Tab"
};

function CommandIcon({ type }: { type: CommandPaletteItem["type"] }) {
  if (type === "file") return <FileText size={16} />;
  if (type === "workspace") return <HardDrive size={16} />;
  if (type === "favorite") return <Star size={16} />;
  return <Folder size={16} />;
}

export function CommandPalette({
  items,
  onClose
}: {
  items: CommandPaletteItem[];
  onClose: () => void;
}) {
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const filteredItems = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return items.slice(0, 40);
    const terms = normalizedQuery.split(/\s+/);
    return items
      .filter((item) => terms.every((term) => item.keywords.includes(term)))
      .slice(0, 40);
  }, [items, query]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  const activeItem = filteredItems[activeIndex];

  const runActiveItem = (newTab: boolean) => {
    if (!activeItem) return;
    activeItem.run({ newTab });
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/45 px-5 pt-[12vh]"
      onMouseDown={onClose}
    >
      <section
        className="w-full max-w-[680px] overflow-hidden rounded-lg border border-line bg-surface shadow-[0_24px_80px_rgb(0_0_0/0.48)]"
        onMouseDown={(event) => event.stopPropagation()}
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            event.preventDefault();
            onClose();
            return;
          }
          if (event.key === "ArrowDown") {
            event.preventDefault();
            setActiveIndex((index) => Math.min(filteredItems.length - 1, index + 1));
            return;
          }
          if (event.key === "ArrowUp") {
            event.preventDefault();
            setActiveIndex((index) => Math.max(0, index - 1));
            return;
          }
          if (event.key === "Enter") {
            event.preventDefault();
            runActiveItem(event.ctrlKey || event.metaKey);
          }
        }}
      >
        <div className="flex h-12 items-center gap-3 border-b border-line-soft px-4">
          <Search size={17} className="text-muted" />
          <input
            ref={inputRef}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="검색 또는 빠른 이동"
            className="h-full min-w-0 flex-1 bg-transparent text-[14px] text-text outline-none placeholder:text-faint"
          />
          <button
            className="grid size-7 place-items-center rounded-md text-muted hover:bg-surface-2 hover:text-text"
            title="닫기"
            onClick={onClose}
          >
            <X size={16} />
          </button>
        </div>

        <div className="max-h-[460px] overflow-y-auto p-2">
          {filteredItems.length === 0 ? (
            <div className="px-3 py-10 text-center text-sm text-muted">검색 결과 없음</div>
          ) : (
            filteredItems.map((item, index) => (
              <button
                key={item.id}
                className={`flex h-12 w-full items-center gap-3 rounded-md px-3 text-left ${
                  index === activeIndex ? "bg-surface-3 text-text" : "text-muted hover:bg-surface-2 hover:text-text"
                }`}
                onMouseEnter={() => setActiveIndex(index)}
                onClick={() => runActiveItem(false)}
              >
                <span className="grid size-7 shrink-0 place-items-center rounded-md bg-surface-2 text-accent">
                  <CommandIcon type={item.type} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">{item.title}</span>
                  {item.subtitle && <span className="block truncate text-xs text-faint">{item.subtitle}</span>}
                </span>
                <span className="shrink-0 rounded border border-line-soft px-1.5 py-0.5 text-[11px] text-faint">
                  {typeLabels[item.type]}
                </span>
              </button>
            ))
          )}
        </div>

        <div className="flex h-9 items-center justify-between border-t border-line-soft px-4 text-[11px] text-faint">
          <span>Enter 현재 탭</span>
          <span>Ctrl+Enter 새 탭</span>
        </div>
      </section>
    </div>
  );
}
