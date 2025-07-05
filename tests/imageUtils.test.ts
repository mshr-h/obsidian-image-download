jest.mock('obsidian', () => ({}), { virtual: true });
import { findImageLinks, buildMarkdownLink } from '../imageUtils';

test('parse markdown image', () => {
  const text = '![alt](http://example.com/a.png "title")';
  const links = findImageLinks(text);
  expect(links).toHaveLength(1);
  expect(links[0].alt).toBe('alt');
  expect(links[0].path).toBe('http://example.com/a.png');
  expect(links[0].title).toBe('title');
});

test('parse wiki image', () => {
  const text = '![[images/pic.png|desc]]';
  const links = findImageLinks(text);
  expect(links).toHaveLength(1);
  expect(links[0].alt).toBe('desc');
  expect(links[0].path).toBe('images/pic.png');
});

test('build markdown link', () => {
  const link = { start: 0, end: 0, path: 'x', alt: 'a', title: 't' };
  const result = buildMarkdownLink(link, 'folder/img.png');
  expect(result).toBe('![a](folder/img.png "t")');
});
