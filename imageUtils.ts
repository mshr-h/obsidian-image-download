import { App, normalizePath, requestUrl, TFile } from 'obsidian';
import * as path from 'path';
import { createHash } from 'crypto';

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

// youtubeリンクか判定
export function isYoutubeLink(url: string): boolean {
  return /^https?:\/\/(www\.)?youtube\.com/i.test(url);
}

export async function saveImage(app: App, src: string, srcFile: TFile, dir: string): Promise<string> {
  const clean = src.split(/[?#]/)[0];
  const ext = path.extname(clean);
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
  const hash = createHash('sha256').update(Buffer.from(data)).digest('hex');
  const filename = `${hash}${ext}`;
  const destPath = normalizePath(path.posix.join(dir, filename));
  if (!(await app.vault.adapter.exists(destPath))) {
    await app.vault.createBinary(destPath, data);
  }
  return filename;
}
