import { App, Notice, Plugin, PluginSettingTab, Setting, TFile } from 'obsidian';
import { SettingsManager, DEFAULT_SETTINGS, ImageDownloadSettings } from './settings';
import { findImageLinks, buildMarkdownLink, saveImage } from './imageUtils';

export default class ImageDownloadPlugin extends Plugin {
  settingsManager!: SettingsManager;
  settings!: ImageDownloadSettings;

  async onload() {
    this.settingsManager = new SettingsManager(this);
    await this.settingsManager.load();
    this.settings = this.settingsManager.settings;

    this.addSettingTab(new ImageDownloadSettingTab(this.app, this));

    this.addCommand({
      id: 'download-linked-images',
      name: 'Download linked images',
      callback: () => this.downloadImagesInVault(),
    });

    this.addCommand({
      id: 'download-images-current-file',
      name: 'Download images in this file',
      editorCallback: (_, view) => {
        if (view.file) {
          this.downloadImagesInFile(view.file);
        }
      },
    });
  }

  async downloadImagesInVault() {
    const files = this.app.vault.getMarkdownFiles();
    let total = 0;
    let success = 0;
    const errors: string[] = [];
    const concurrency = 5;
    const fileQueue = [...files];
    const worker = async () => {
      while (fileQueue.length > 0) {
        const file = fileQueue.shift();
        if (file) {
          const res = await this.processFile(file);
          total += res.total;
          success += res.success;
          errors.push(...res.errors);
        }
      }
    };
    const workers = Array(Math.min(concurrency, files.length)).fill(null).map(worker);
    await Promise.all(workers);
    new Notice(`Downloaded ${success}/${total} images.` + (errors.length ? ` Errors: ${errors.join('; ')}` : ''));
  }

  async downloadImagesInFile(file: TFile) {
    const res = await this.processFile(file);
    new Notice(`Downloaded ${res.success}/${res.total} images.` + (res.errors.length ? ` Errors: ${res.errors.join('; ')}` : ''));
  }

  private async processFile(file: TFile): Promise<{ total: number; success: number; errors: string[] }> {
    const text = await this.app.vault.read(file);
    const links = findImageLinks(text);
    const result = { total: links.length, success: 0, errors: [] as string[] };
    if (links.length === 0) return result;
    let content = text;
    for (let i = links.length - 1; i >= 0; i--) {
      const link = links[i];
      if (link.path.startsWith(this.settings.downloadDir + '/')) continue;
      try {
        const filename = await saveImage(this.app, link.path, file, this.settings.downloadDir);
        const newLink = buildMarkdownLink(link, `${this.settings.downloadDir}/${filename}`);
        content = content.slice(0, link.start) + newLink + content.slice(link.end);
        result.success++;
      } catch (e: any) {
        result.errors.push(`${link.path}: ${e.message}`);
      }
    }
    if (content !== text) {
      await this.app.vault.modify(file, content);
    }
    return result;
  }

  async saveSettings() {
    await this.settingsManager.save();
    this.settings = this.settingsManager.settings;
  }
}

class ImageDownloadSettingTab extends PluginSettingTab {
  constructor(app: App, private plugin: ImageDownloadPlugin) {
    super(app, plugin);
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();

    new Setting(containerEl)
      .setName('Download folder')
      .setDesc('Relative to vault root')
      .addText(text =>
        text
          .setPlaceholder('downloaded-images')
          .setValue(this.plugin.settings.downloadDir)
          .onChange(async (value) => {
            this.plugin.settings.downloadDir = value.trim() || DEFAULT_SETTINGS.downloadDir;
            await this.plugin.saveSettings();
          }));
  }
}
