import { FileText, Folder, LayoutGrid, List } from "lucide-react";
import type { AppSettings, FileNode, SelectedFolder } from "../types";
import { formatDate, sortNodes } from "../lib/fileTree";

function FolderSection({
  title,
  nodes,
  mode,
  onOpenFile,
  onSelectFolder
}: {
  title: string;
  nodes: FileNode[];
  mode: "cards" | "list";
  onOpenFile: (node: FileNode, options?: { newTab?: boolean }) => void;
  onSelectFolder: (node: FileNode, options?: { newTab?: boolean }) => void;
}) {
  return (
    <section className="folder-section">
      <h2>{title}</h2>
      {nodes.length === 0 ? (
        <p className="section-empty">표시할 항목이 없습니다.</p>
      ) : (
        <div className={`folder-items ${mode}`}>
          {nodes.map((child) => (
            <button
              key={child.path}
              className="folder-card"
              onClick={(event) => child.type === "file" ? onOpenFile(child, { newTab: event.ctrlKey || event.metaKey }) : onSelectFolder(child, { newTab: event.ctrlKey || event.metaKey })}
            >
              <div className="folder-card-icon">{child.type === "folder" ? <Folder size={18} /> : <FileText size={18} />}</div>
              <div>
                <strong>{child.title}</strong>
                <span>{child.type === "folder" ? `${child.childCount ?? 0}개 항목` : `${child.extension} · ${formatDate(child.modifiedAt)}`}</span>
                {child.preview && <p>{child.preview.slice(0, 5).join(" · ")}</p>}
              </div>
            </button>
          ))}
        </div>
      )}
    </section>
  );
}

export function FolderView({
  selectedFolder,
  settings,
  onSetFolderViewMode,
  onOpenFile,
  onSelectFolder
}: {
  selectedFolder: SelectedFolder;
  settings: AppSettings;
  onSetFolderViewMode: (mode: "cards" | "list") => void;
  onOpenFile: (node: FileNode, options?: { newTab?: boolean }) => void;
  onSelectFolder: (node: FileNode, options?: { newTab?: boolean }) => void;
}) {
  const sortedChildren = sortNodes(selectedFolder.children, settings, selectedFolder.path);
  const folders = sortedChildren.filter((child) => child.type === "folder");
  const files = sortedChildren.filter((child) => child.type === "file");

  return (
    <div className="folder-view">
      <div className="view-head">
        <div>
          <p>폴더</p>
          <h1>{selectedFolder.title}</h1>
        </div>
        <div className="segmented">
          <button
            title="카드 보기"
            className={settings.folderViewMode === "cards" ? "active" : ""}
            onClick={() => onSetFolderViewMode("cards")}
          >
            <LayoutGrid size={15} />
          </button>
          <button
            title="리스트 보기"
            className={settings.folderViewMode === "list" ? "active" : ""}
            onClick={() => onSetFolderViewMode("list")}
          >
            <List size={15} />
          </button>
        </div>
      </div>

      <FolderSection title="하위 폴더" nodes={folders} mode={settings.folderViewMode} onOpenFile={onOpenFile} onSelectFolder={onSelectFolder} />
      <div className="section-divider" />
      <FolderSection title="문서" nodes={files} mode={settings.folderViewMode} onOpenFile={onOpenFile} onSelectFolder={onSelectFolder} />
    </div>
  );
}
