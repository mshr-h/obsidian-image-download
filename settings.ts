import { normalizePath, Plugin } from 'obsidian';

export interface ImageDownloadSettings {
  downloadDir: string;
}

export const DEFAULT_SETTINGS: ImageDownloadSettings = {
  downloadDir: 'downloaded-images',
};

export class SettingsManager {
  settings: ImageDownloadSettings = { ...DEFAULT_SETTINGS };
  constructor(private plugin: Plugin) {}

  async load(): Promise<void> {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.plugin.loadData());
    await this.ensureDir();
  }

  async save(): Promise<void> {
    await this.ensureDir();
    await this.plugin.saveData(this.settings);
  }

  private async ensureDir(): Promise<void> {
    this.settings.downloadDir = normalizePath(this.settings.downloadDir || DEFAULT_SETTINGS.downloadDir);
    const adapter = this.plugin.app.vault.adapter;
    if (!(await adapter.exists(this.settings.downloadDir))) {
      await adapter.mkdir(this.settings.downloadDir);
    }
  }
}
