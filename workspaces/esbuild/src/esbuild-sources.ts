import { readFile } from 'node:fs/promises';
import { readFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { getTsconfig } from 'get-tsconfig';
import { type Format } from '@node-loaders/core';
import { detectPackageJsonType, LoaderCache } from '@node-loaders/resolve';
import { transform, type TransformOptions, transformSync, type Format as EsbuildFormat } from 'esbuild';

type EsbuildSource = {
  source: string;
  format: Format;
};

type TsconfigCache = {
  config: any;
  hash: string;
};

const getEsbuildFormatForFormat = (format: Format): EsbuildFormat => (format === 'module' ? 'esm' : 'cjs');
const getExtensionForFormat = (format: Format): string => (format === 'module' ? 'mjs' : 'cjs');

const defaultEsbuildOptions: TransformOptions = {
  loader: 'default',
  minifyWhitespace: true,
  keepNames: false,
  sourcemap: 'inline',
};

export class EsbuildSources {
  readonly esbuildOptions: TransformOptions;
  readonly sourcesCache: Record<string, EsbuildSource> = {};
  readonly tsconfigCache: Record<string, TsconfigCache> = {};
  readonly cache: LoaderCache = new LoaderCache('esbuild');
  readonly optionsHash: string;
  private sourceMapSet = false;

  constructor(esbuildOptions = defaultEsbuildOptions) {
    this.esbuildOptions = esbuildOptions;
    this.optionsHash = this.cache.createHash(JSON.stringify(defaultEsbuildOptions));
  }

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
  async getSource(fileUrl: string, maybeFormat?: Format): Promise<EsbuildSource> {
    if (this.sourcesCache[fileUrl]) {
      return this.sourcesCache[fileUrl];
    }

    this.setupSourceMap();

    const filePath = fileURLToPath(fileUrl);
    const sourceFile = await readFile(filePath);
    const fileContent = sourceFile.toString();

    const tsconfigCache = this.findTsConfig(filePath);

    /* c8 ignore next 2 */
    const format: Format = maybeFormat ?? (await detectPackageJsonType(filePath)) ?? 'module';
    const esbuildFormat = getEsbuildFormatForFormat(format);

    const cacheOptions = { modifiers: [this.optionsHash, tsconfigCache?.hash], extension: getExtensionForFormat(format) };
    let transformed = await this.cache.get(fileContent, cacheOptions);
    if (!transformed) {
      const result = await transform(fileContent, {
        ...this.esbuildOptions,
        sourcefile: filePath,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        tsconfigRaw: tsconfigCache?.config,
        format: getEsbuildFormatForFormat(format),
      });
      transformed = result.code;
      await this.cache.save(transformed, cacheOptions);
    }

    this.sourcesCache[fileUrl] = { source: transformed, format };

    return this.sourcesCache[fileUrl];
  }

  /* c8 ignore next */
  getSourceSync(fileUrl: string): EsbuildSource {
    if (this.sourcesCache[fileUrl]) {
      return this.sourcesCache[fileUrl];
    }

    // Sync method supports commonjs only
    const commonjsFormat: Format = 'commonjs';

    this.setupSourceMap();

    const filePath = fileURLToPath(fileUrl);

    const fileContent = readFileSync(filePath, 'utf8').toString();
    const tsconfigCache = this.findTsConfig(filePath);
    const cacheOptions = {
      file: this.cache.createHash(fileContent),
      modifiers: [this.optionsHash, tsconfigCache?.hash],
      extension: getExtensionForFormat(commonjsFormat),
    };

    let transformed = this.cache.getSync(cacheOptions);
    if (!transformed) {
      const result = transformSync(fileContent, {
        ...this.esbuildOptions,
        sourcefile: filePath,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        tsconfigRaw: tsconfigCache?.config,
        format: getEsbuildFormatForFormat(commonjsFormat),
      });
      transformed = result.code;
      this.cache.saveSync(transformed, cacheOptions);
    }

    this.sourcesCache[fileUrl] = { source: transformed, format: commonjsFormat };
    return this.sourcesCache[fileUrl];
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
        let subDirectory = sourceDirname;
        while (subDirectory.length > 5 && subDirectory !== tsconfigDirname) {
          subDirectory = join(subDirectory, '..');
          this.tsconfigCache[subDirectory] = cache;
        }
      }
    }

    return this.tsconfigCache[sourceDirname];
  }
}
