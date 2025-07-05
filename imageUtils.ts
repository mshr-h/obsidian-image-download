import { App, normalizePath, requestUrl, TFile } from 'obsidian';
import * as path from 'path';

export interface ImageLink {
  start: number;
  end: number;
  path: string;
  alt?: string;
  title?: string;
}

// 画像リンクを抽出
export function findImageLinks(text: string): ImageLink[] {
  const links: ImageLink[] = [];
  const md = /!\[([^\]]*)\]\(([^)]+)\)/g; // Markdown
  const wiki = /!\[\[([^\]]+)\]\]/g; // Wiki
  let m: RegExpExecArray | null;
  while ((m = md.exec(text)) !== null) {
    const alt = m[1];
    const inner = m[2].trim();
    let linkPath = inner;
    let title: string | undefined;
    const titleMatch = inner.match(/^(.*)\s+"([^"]*)"$/);
    if (titleMatch) {
      linkPath = titleMatch[1];
      title = titleMatch[2];
    }
    links.push({ start: m.index, end: m.index + m[0].length, path: linkPath, alt, title });
  }
  while ((m = wiki.exec(text)) !== null) {
    const inner = m[1];
    const [linkPath, alt] = inner.split('|');
    links.push({ start: m.index, end: m.index + m[0].length, path: linkPath.trim(), alt: alt?.trim() });
  }
  return links.sort((a, b) => a.start - b.start);
}

export function buildMarkdownLink(link: ImageLink, newPath: string): string {
  let result = `![${link.alt ?? ''}](${newPath}`;
  if (link.title) result += ` "${link.title}"`;
  result += ')';
  return result;
}

export async function getUniqueFilename(app: App, dir: string, base: string): Promise<string> {
  const adapter = app.vault.adapter;
  let candidate = normalizePath(path.posix.join(dir, base));
  if (!(await adapter.exists(candidate))) return candidate;
  const parsed = path.parse(base);
  let i = 1;
  while (await adapter.exists(normalizePath(path.posix.join(dir, `${parsed.name} (${i})${parsed.ext}`)))) {
    i++;
  }
  return normalizePath(path.posix.join(dir, `${parsed.name} (${i})${parsed.ext}`));
}

export async function saveImage(app: App, src: string, srcFile: TFile, dir: string): Promise<string> {
  const base = path.basename(src);
  const destPath = await getUniqueFilename(app, dir, base);
  let data: ArrayBuffer;
  if (/^https?:\/\//i.test(src)) {
    const resp = await requestUrl({ url: src });
    data = resp.arrayBuffer;
  } else {
    let resolved: string | null = null;
    const linked = app.metadataCache.getFirstLinkpathDest(src, srcFile.path);
    if (linked) {
      resolved = linked.path;
    } else {
      resolved = normalizePath(path.posix.join(path.posix.dirname(srcFile.path), src));
    }
    data = await app.vault.adapter.readBinary(resolved);
  }
  await app.vault.createBinary(destPath, data);
  return path.basename(destPath);
}
