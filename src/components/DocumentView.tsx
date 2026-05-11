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
        <span>{file.relativePath}</span>
        <span>{file.extension}</span>
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
