import { readFile } from 'node:fs/promises';
import { readFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { getTsconfig } from 'get-tsconfig';
import { type Format } from '@node-loaders/core';
import { detectPackageJsonType, LoaderCache } from '@node-loaders/resolve';
import { transform, type TransformOptions, transformSync } from 'esbuild';

type EsbuildSource = {
  source: string;
  format: Format;
};

type TsconfigCache = {
  config: any;
  hash: string;
};

const cacheExtension = 'mjs';

export class EsbuildSources {
  readonly sourcesCache: Record<string, EsbuildSource> = {};
  readonly tsconfigCache: Record<string, TsconfigCache> = {};
  readonly cache: LoaderCache = new LoaderCache('esbuild');
  private sourceMapSet = false;

  setupSourceMap() {
    if (this.sourceMapSet) {
      return;
    }

    if ('setSourceMapsEnabled' in process && typeof Error.prepareStackTrace !== 'function') {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      (process as any).setSourceMapsEnabled(true);
    }

    this.sourceMapSet = true;
  }

  /* c8 ignore next */
  async getSource(fileUrl: string, maybeFormat?: string): Promise<EsbuildSource> {
    if (this.sourcesCache[fileUrl]) {
      return this.sourcesCache[fileUrl];
    }

    this.setupSourceMap();

    const filePath = fileURLToPath(fileUrl);
    const sourceFile = await readFile(filePath);
    const fileContent = sourceFile.toString();

    const tsconfigCache = this.findTsConfig(filePath);
    const cacheOptions = { modifier: tsconfigCache?.hash, extension: cacheExtension };
    let transformed = await this.cache.get(fileContent, cacheOptions);

    /* c8 ignore next 2 */
    const format: Format = (maybeFormat ?? (await detectPackageJsonType(filePath)) ?? 'module') as Format;
    const esbuildFormat = format === 'module' ? 'esm' : 'cjs';

    if (!transformed) {
      const result = await transform(
        fileContent,
        this.getOptions(tsconfigCache?.config, {
          sourcefile: filePath,
          format: esbuildFormat,
        }),
      );
      transformed = result.code;
      await this.cache.save(transformed, cacheOptions);
    }

    this.sourcesCache[fileUrl] = { source: transformed, format };

    return this.sourcesCache[fileUrl];
  }

  /* c8 ignore next */
  getSourceSync(fileUrl: string, format: Format = 'commonjs'): EsbuildSource {
    if (this.sourcesCache[fileUrl]) {
      return this.sourcesCache[fileUrl];
    }

    this.setupSourceMap();

    const filePath = fileURLToPath(fileUrl);

    const fileContent = readFileSync(filePath, 'utf8').toString();
    const tsconfigCache = this.findTsConfig(filePath);
    const cacheOptions = { file: this.cache.createHash(fileContent), modifier: tsconfigCache?.hash, extension: cacheExtension };

    let transformed = this.cache.getSync(cacheOptions);
    if (!transformed) {
      const result = transformSync(
        fileContent,
        this.getOptions(tsconfigCache?.config, {
          sourcefile: filePath,
          format: 'cjs',
        }),
      );
      transformed = result.code;
      this.cache.saveSync(transformed, cacheOptions);
    }

    this.sourcesCache[fileUrl] = { source: transformed, format };
    return this.sourcesCache[fileUrl];
  }

  getOptions(tsconfig: any, options: TransformOptions & Required<Pick<TransformOptions, 'sourcefile'>>): TransformOptions {
    return {
      loader: 'default',
      minifyWhitespace: true,
      keepNames: true,
      sourcemap: 'inline',
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      tsconfigRaw: tsconfig,
      ...options,
    };
  }

  findTsConfig(sourceFile: string): TsconfigCache {
    const sourceDirname = dirname(sourceFile);
    if (this.tsconfigCache[sourceDirname]) {
      return this.tsconfigCache[sourceDirname];
    }

    const result = getTsconfig(sourceDirname);
    if (result) {
      const tsconfigDirname = dirname(result.path);
      const hash = this.cache.createHash(JSON.stringify(result.config));
      const cache = { config: result.config, hash };

      this.tsconfigCache[sourceDirname] = cache;
      if (/^[./\\]*$/.test(relative(sourceDirname, tsconfigDirname))) {
        let subDir = sourceDirname;
        while (subDir.length > 5 && subDir !== tsconfigDirname) {
          subDir = join(subDir, '..');
          this.tsconfigCache[subDir] = cache;
        }
      }
    }

    return this.tsconfigCache[sourceDirname];
  }
}
