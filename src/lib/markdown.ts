import { marked } from "marked";
import type { FileNode } from "../types";

export function normalizeLinkName(value: string) {
  return value
    .replace(/\\/g, "/")
    .replace(/#.*/, "")
    .replace(/\.md$/i, "")
    .trim()
    .toLowerCase();
}

export function basenameWithoutExtension(value: string) {
  const normalized = normalizeLinkName(value);
  const parts = normalized.split("/");
  return parts[parts.length - 1] ?? normalized;
}

export function linkCandidates(node: FileNode) {
  return [
    normalizeLinkName(node.title),
    normalizeLinkName(node.name),
    normalizeLinkName(node.relativePath),
    basenameWithoutExtension(node.relativePath),
    basenameWithoutExtension(node.name)
  ];
}

export function safeDecode(value: string) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

export function renderMarkdown(content: string, title: string) {
  const escapedTitle = title.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const withoutDuplicateTitle = content.replace(new RegExp(`^#\\s+${escapedTitle}\\s*(\\r?\\n)?`), "");
  const withWikiLinks = withoutDuplicateTitle.replace(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g, (_match, target: string, label?: string) => {
    const text = label || target;
    return `<a href="#" data-wiki-link="${target.replace(/"/g, "&quot;")}">${text}</a>`;
  });
  return { __html: marked.parse(withWikiLinks, { async: false }) };
}
