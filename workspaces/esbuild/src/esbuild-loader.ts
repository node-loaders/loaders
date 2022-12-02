import { readFile } from 'node:fs/promises';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { transform, installSourceMapSupport } from '@esbuild-kit/core-utils';
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
import { existingFile, lookForDefaultModule, specifierToFilePath } from '@node-loaders/resolve';
import {
  detectFormatForEsbuildFileExtension,
  detectFormatForEsbuildFilePath,
  isEsbuildExtensionSupported,
  lookForEsbuildReplacementFile,
} from './esbuild-module.js';

export type EsbuildLoaderOptions = LoaderBaseOptions & {
  allowDefaults?: boolean;
};

export default class EsbuildLoader extends LoaderBase {
  allowDefaults: boolean;

  constructor(options: EsbuildLoaderOptions = {}) {
    // We want builtin modules and package import to pass through
    super({ matchBuiltinSpecifier: false, matchPackageSpecifier: false, ...options });

    const { allowDefaults = false } = options;

    this.allowDefaults = allowDefaults;
  }

  protected async lookForExistingEsbuildFilePath(filePath: string): Promise<string | undefined> {
    return (
      // Look for the bare resolved path
      (await existingFile(filePath)) ??
      // Optionally look for js directory imports and imports without extension
      (this.allowDefaults ? lookForDefaultModule(filePath) : undefined) ??
      // Optionally look for ts directory imports and imports without extension
      (this.allowDefaults ? lookForDefaultModule(filePath, '.ts') : undefined) ??
      // Look for replacements files
      lookForEsbuildReplacementFile(filePath)
    );
  }

  protected override _matchesEspecifier(specifier: string, context?: ResolveContext | undefined): boolean {
    return isFileSpecifier(specifier);
  }

  protected override async _resolve(specifier: string, context: ResolveContext, nextResolve: NextResolve): Promise<ResolvedModule> {
    if (isPackageJsonImportSpecifier(specifier)) {
      // Delegate package.json imports mapping to the chain.
      const resolved = await nextResolve(specifier, context);
      specifier = resolved.url;
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

    return nextResolve(specifier, context);
  }

  protected override async _load(url: string, context: LoadContext, nextLoad: NextLoad): Promise<LoadedModule> {
    if (isEsbuildExtensionSupported(url)) {
      const filePath = fileURLToPath(url);
      const code = await readFile(filePath);
      const transformed = await transform(code.toString(), filePath);
      return {
        format: context.format ?? (await detectFormatForEsbuildFilePath(filePath)),
        source: installSourceMapSupport()(transformed, url),
        shortCircuit: true,
      };
    }

    return nextLoad(url, context);
  }
}
