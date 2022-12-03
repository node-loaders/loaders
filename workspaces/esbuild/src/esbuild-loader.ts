import { readFile } from 'node:fs/promises';
import { fileURLToPath, pathToFileURL } from 'node:url';
import process from 'node:process';

import { transform, type TransformOptions } from 'esbuild';
import {
  type LoadContext,
  type LoadedModule,
  type LoaderBaseOptions,
  type NextResolve,
  type NextLoad,
  type ResolveContext,
  type ResolvedModule,
  isFileSpecifier,
  isPackageJsonImportSpecifier,
  Node14Loader,
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

export default class EsbuildLoader extends Node14Loader {
  allowDefaults: boolean;
  sourceMapEnabled = false;

  constructor(options: EsbuildLoaderOptions = {}) {
    // We want builtin modules and package import to pass through
    super({ forwardBuiltinSpecifiers: true, forwardPackageSpecifiers: true, ...options });

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

  override _matchesEspecifier(specifier: string, context?: ResolveContext | undefined): boolean {
    return isFileSpecifier(specifier);
  }

  protected override async _resolve(specifier: string, context: ResolveContext, nextResolve: NextResolve): Promise<ResolvedModule> {
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

  protected override async _load(url: string, context: LoadContext, nextLoad: NextLoad): Promise<LoadedModule> {
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

  protected async transform(filePath: string, format: string): Promise<string> {
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

  protected getOptions(options?: TransformOptions): TransformOptions {
    return {
      loader: 'default',
      target: `node16`,
      minifyWhitespace: true,
      keepNames: true,
      sourcemap: 'inline',
      ...options,
    };
  }
}

export class Node14EsbuildLoader extends EsbuildLoader {
  override async _getFormat(url: string): Promise<undefined | { format: string }> {
    if (!isEsbuildExtensionSupported(url)) {
      return undefined;
    }

    const format = detectFormatForEsbuildFileExtension(url) ?? (await detectPackageJsonType(fileURLToPath(url)));
    return { format };
  }

  override async _getSource(
    url: string,
    context: { format: string },
  ): Promise<undefined | { source: string | SharedArrayBuffer | Uint8Array }> {
    if (!isEsbuildExtensionSupported(url)) {
      return undefined;
    }

    return {
      source: await this.transform(fileURLToPath(url), context.format),
    };
  }
}
