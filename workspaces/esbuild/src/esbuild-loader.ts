import { readFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import process from 'node:process';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { transform, type TransformOptions } from 'esbuild';
import { getTsconfig } from 'get-tsconfig';
import LoaderBase, {
  type LoadContext,
  type LoadedModule,
  type LoaderBaseOptions,
  type NextResolve,
  type NextLoad,
  type ResolveContext,
  type ResolvedModule,
  isFileSpecifier,
  isPackageJsonImportSpecifier,
} from '@node-loaders/core';
import {
  existingFile,
  lookForDefaultModule,
  specifierToFilePath,
  detectPackageJsonType,
  resolvePackageJsonImports,
} from '@node-loaders/resolve';

import { detectFormatForEsbuildFileExtension, isEsbuildExtensionSupported, lookForEsbuildReplacementFile } from './esbuild-module.js';

export type EsbuildLoaderOptions = LoaderBaseOptions & {
  allowDefaults?: boolean;
};

export default class EsbuildLoader extends LoaderBase {
  allowDefaults: boolean;
  sourceMapEnabled = false;

  constructor(options: EsbuildLoaderOptions = {}) {
    // We want builtin modules and package import to pass through
    super('esbuild', {
      forwardBuiltinSpecifiers: true,
      forwardPackageSpecifiers: true,
      forwardNodeModulesSpecifiers: true,
      forwardNodeModulesParentSpecifiers: true,
      ...options,
    });

    const { allowDefaults = false } = options;

    this.allowDefaults = allowDefaults;
  }

  async lookForExistingEsbuildFilePath(filePath: string): Promise<string | undefined> {
    return (
      // Look for the bare resolved path
      (await existingFile(filePath)) ??
      // Optionally look for js directory imports and imports without extension
      (this.allowDefaults ? await lookForDefaultModule(filePath) : undefined) ??
      // Optionally look for ts directory imports and imports without extension
      (this.allowDefaults ? await lookForDefaultModule(filePath, '.ts') : undefined) ??
      // Look for replacements files
      lookForEsbuildReplacementFile(filePath)
    );
  }

  override _handlesEspecifier(specifier: string, context?: ResolveContext | undefined): boolean {
    return isFileSpecifier(specifier);
  }

  override async _resolve(specifier: string, context: ResolveContext, nextResolve: NextResolve): Promise<ResolvedModule> {
    if (isPackageJsonImportSpecifier(specifier)) {
      specifier = await resolvePackageJsonImports(specifier, context.parentURL!);
    }

    const filePath = specifierToFilePath(specifier, context.parentURL);
    const resolvedFilePath = await this.lookForExistingEsbuildFilePath(filePath);
    if (!resolvedFilePath) {
      throw new Error(`Module not found ${specifier}`);
    }

    if (isEsbuildExtensionSupported(resolvedFilePath)) {
      const resolvedUrl = pathToFileURL(resolvedFilePath).href;
      return {
        url: resolvedUrl,
        shortCircuit: true,
        format: detectFormatForEsbuildFileExtension(resolvedUrl),
      };
    }

    this.log(`Forwarding ${specifier}`);
    return nextResolve(specifier, context);
  }

  override async _load(url: string, context: LoadContext, nextLoad: NextLoad): Promise<LoadedModule> {
    if (isEsbuildExtensionSupported(url)) {
      const filePath = fileURLToPath(url);
      const format = context.format ?? (await detectPackageJsonType(filePath));
      return {
        format,
        source: await this.transform(filePath, format),
        shortCircuit: true,
      };
    }

    return nextLoad(url, context);
  }

  async transform(filePath: string, format: string): Promise<string> {
    this.log(`Transforming ${filePath}`);
    const code = await readFile(filePath);
    const esbuildFormat = format === 'module' ? 'esm' : 'cjs';

    // We are transpiling, enable sourcemap is available
    if (!this.sourceMapEnabled) {
      if ('setSourceMapsEnabled' in process && typeof Error.prepareStackTrace !== 'function') {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call
        (process as any).setSourceMapsEnabled(true);
      }

      this.sourceMapEnabled = true;
    }

    const { code: source } = await transform(
      code.toString(),
      this.getOptions({
        sourcefile: filePath,
        format: esbuildFormat,
      }),
    );

    return source;
  }

  getOptions(options: TransformOptions & Required<Pick<TransformOptions, 'sourcefile'>>): TransformOptions {
    const tsconfigRaw = getTsconfig(dirname(options.sourcefile))?.config as unknown;
    return {
      loader: 'default',
      minifyWhitespace: true,
      keepNames: true,
      sourcemap: 'inline',
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      tsconfigRaw: tsconfigRaw as any,
      ...options,
    };
  }
}
