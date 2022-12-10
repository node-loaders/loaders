import { createHash } from 'node:crypto';
import { tmpdir } from 'node:os';

import { join } from 'node:path';
import { readFile, writeFile } from 'node:fs/promises';
import { existsSync, mkdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { findUpSync } from 'find-up';
import { existingFile, existingFileSync } from './resolve-path.js';

export type CacheOptions = { file: string; modifiers?: string[]; extension?: string };
export type LoaderCacheOptions = { cacheRoot?: string; hashType?: string };

export class LoaderCache {
  cacheDir?: string;
  customDir: boolean;
  hashType: string;

  constructor(loaderName: string, options: LoaderCacheOptions = {}) {
    this.hashType = options.hashType ?? 'sha1';

    let { cacheRoot } = options;
    this.customDir = Boolean(cacheRoot);
    let folder;
    if (!cacheRoot) {
      cacheRoot = findUpSync('node_modules', { type: 'directory' });
      if (cacheRoot) {
        folder = '.cache/@node-loaders';
      } else {
        cacheRoot = tmpdir();
      }
    }

    this.ensureCacheDirExists(join(cacheRoot, folder ?? '@node-loaders', loaderName));
  }

  cleanup() {
    if (!this.customDir && this.cacheDir && existsSync(this.cacheDir)) {
      const { cacheDir } = this;
      this.cacheDir = undefined;
      rmSync(cacheDir, { recursive: true });
      this.ensureCacheDirExists(cacheDir);
    }
  }

  getCacheFile(dir: string, { file, modifiers, extension }: CacheOptions & { file: string }): string {
    return join(dir, `${modifiers && modifiers.length > 0 ? `${modifiers.join('-')}-` : ''}${file}.${extension ?? 'cache'}`);
  }

  /* c8 ignore next */
  createHash(source: string) {
    return createHash(this.hashType).update(source).digest('hex');
  }

  /* c8 ignore next 2 */
  async get(content: string, options?: Omit<CacheOptions, 'file'>): Promise<string | undefined>;
  async get(options: CacheOptions): Promise<string | undefined>;
  async get(contentOrOptions: string | CacheOptions, options?: CacheOptions): Promise<string | undefined> {
    if (!this.cacheDir) {
      return undefined;
    }

    const cacheFile = this.getCacheFile(this.cacheDir, this.parseGetOptions(contentOrOptions, options));
    if (await existingFile(cacheFile)) {
      const file = await readFile(cacheFile);
      return file.toString();
    }

    return undefined;
  }

  getSync(content: string, options?: Omit<CacheOptions, 'file'>): string | undefined;
  getSync(options: CacheOptions): string | undefined;
  getSync(contentOrOptions: string | CacheOptions, options?: CacheOptions): string | undefined {
    if (!this.cacheDir) {
      return undefined;
    }

    const cacheFile = this.getCacheFile(this.cacheDir, this.parseGetOptions(contentOrOptions, options));
    if (existingFileSync(cacheFile)) {
      const file = readFileSync(cacheFile);
      return file.toString();
    }

    return undefined;
  }

  async save(content: string, options?: Partial<CacheOptions>): Promise<void> {
    if (!this.cacheDir) {
      return;
    }

    try {
      await writeFile(this.getCacheFile(this.cacheDir, this.parseSaveOptions(content, options)), content);
    } catch {}
  }

  saveSync(content: string, options?: Partial<CacheOptions>): void {
    if (!this.cacheDir) {
      return;
    }

    try {
      writeFileSync(this.getCacheFile(this.cacheDir, this.parseSaveOptions(content, options)), content);
    } catch {}
  }

  private parseGetOptions(contentOrOptions: string | CacheOptions, options?: CacheOptions): CacheOptions {
    return typeof contentOrOptions === 'string' ? { ...options, file: this.createHash(contentOrOptions) } : contentOrOptions;
  }

  private parseSaveOptions(content: string, options?: Partial<CacheOptions>): CacheOptions {
    return { ...options, file: options?.file ?? this.createHash(content) };
  }

  private ensureCacheDirExists(directory: string): void {
    try {
      const stat = statSync(directory);
      if (stat.isDirectory()) {
        this.cacheDir = directory;
      }
    } catch {
      try {
        mkdirSync(directory, { recursive: true });
        this.cacheDir = directory;
      } catch {}
    }
  }
}
