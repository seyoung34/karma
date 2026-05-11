import { Copy } from "lucide-react";
import type { DocumentWidth, MarkdownFile } from "../types";
import { renderMarkdown } from "../lib/markdown";

export function DocumentView({
  file,
  width,
  onWikiLink
}: {
  file: MarkdownFile;
  width: DocumentWidth;
  onWikiLink: (target: string, newTab: boolean) => void;
}) {
  return (
    <article className={`document document-width-${width}`}>
      <div className="document-meta">
        <div className="document-meta-main">
          <button
            className="path-copy-button"
            title="절대 경로 복사"
            onClick={() => void window.karma.copyText(file.path)}
          >
            <Copy size={14} />
          </button>
          <span className="document-meta-path">{file.relativePath}</span>
        </div>
        <span className="document-meta-name">{file.path.split(/[\\/]/).pop() ?? file.extension}</span>
      </div>
      <h1>{file.title}</h1>
      <div
        className="markdown-body"
        dangerouslySetInnerHTML={renderMarkdown(file.content, file.title)}
        onClick={(event) => {
          const target = event.target as HTMLElement;
          const link = target.closest<HTMLAnchorElement>("a[data-wiki-link]");
          if (!link) return;
          event.preventDefault();
          onWikiLink(link.dataset.wikiLink ?? "", event.ctrlKey || event.metaKey);
        }}
      />
    </article>
  );
}
