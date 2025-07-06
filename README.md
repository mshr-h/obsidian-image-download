# Image Download Plugin

Image Download is an Obsidian plugin that fetches all linked images in your notes and stores them inside your vault. After downloading, the plugin automatically rewrites the image links so that they point to the local copies.

## Features

- Download every linked image in the current file or across the entire vault.
- Supports Markdown and wikilink style image links.
- Skips YouTube URLs.
- Images are stored in a folder of your choice (default: `downloaded-images`).
- Existing images in that folder are not downloaded again.

## Commands

- **Download linked images** &mdash; scan the whole vault and download all images.
- **Download images in this file** &mdash; process only the active file.

A settings tab is available to change the destination folder.

## Development

1. Install Node.js 16 or later.
2. Run `npm i` to install dependencies.
3. Use `npm run dev` to build the plugin in watch mode.
4. Build a production bundle with `npm run build`.

## Manual installation

Copy `manifest.json`, `main.js` and `styles.css` into `<your vault>/.obsidian/plugins/image-download/`.

## License

Distributed under the MIT License.

