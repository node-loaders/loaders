import { readFile } from 'node:fs/promises';
import { readFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { getTsconfig } from 'get-tsconfig';
import { type Format } from '@node-loaders/core';
import { detectPackageJsonType } from '@node-loaders/resolve';
import { transform, type TransformOptions, transformSync } from 'esbuild';

type EsbuildSource = {
  source: string;
  format: Format;
};

export class EsbuildSources {
  private sourcesCache: Record<string, EsbuildSource> = {};
  private tsconfigCache: Record<string, any> = {};

  async getSource(fileUrl: string, maybeFormat?: string): Promise<EsbuildSource> {
    if (this.sourcesCache[fileUrl]) {
      return this.sourcesCache[fileUrl];
    }

    const filePath = fileURLToPath(fileUrl);
    const format: Format = (maybeFormat ?? (await detectPackageJsonType(filePath)) ?? 'module') as Format;

    const sourceFile = await readFile(filePath);
    const esbuildFormat = format === 'module' ? 'esm' : 'cjs';

    const { code: transformed } = await transform(
      sourceFile.toString(),
      this.getOptions({
        sourcefile: filePath,
        format: esbuildFormat,
      }),
    );
    this.sourcesCache[fileUrl] = { source: transformed, format };

    return this.sourcesCache[fileUrl];
  }

  getSourceSync(fileUrl: string, format: Format = 'commonjs'): EsbuildSource {
    if (this.sourcesCache[fileUrl]) {
      return this.sourcesCache[fileUrl];
    }

    const filePath = fileURLToPath(fileUrl);

    const code = readFileSync(filePath, 'utf8');
    const { code: transformed } = transformSync(
      code,
      this.getOptions({
        sourcefile: filePath,
        format: 'cjs',
      }),
    );
    this.sourcesCache[fileUrl] = { source: transformed, format };
    return this.sourcesCache[fileUrl];
  }

  getOptions(options: TransformOptions & Required<Pick<TransformOptions, 'sourcefile'>>): TransformOptions {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const tsconfig = this.findTsConfig(options.sourcefile);
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

  findTsConfig(sourceFile: string): any {
    const sourceDirname = resolve(dirname(sourceFile));
    if (this.tsconfigCache[sourceDirname]) {
      return this.sourcesCache[sourceDirname];
    }

    const result = getTsconfig(sourceDirname);
    if (result) {
      const tsconfigDirname = resolve(dirname(result.path));
      this.tsconfigCache[sourceDirname] = result.config;
      if (/^[./\\]*$/.test(relative(sourceDirname, tsconfigDirname))) {
        let subDir = sourceDirname;
        while (subDir.length > 5 && subDir !== tsconfigDirname) {
          subDir = join(subDir, '..');
          this.tsconfigCache[subDir] = result.config;
        }
      }
    }

    return this.tsconfigCache[sourceDirname];
  }
}
