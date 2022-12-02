import { readFile } from 'node:fs/promises';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { inspect } from 'node:util';

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
} from '@node-loaders/core';
import { existingFile, lookForDefaultModule, resolvePath } from '@node-loaders/resolve';
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

  /**
   * Resolve and lookup for existing module (file)
   * @param url
   * @param parentUrl
   * @returns
   */
   protected async resolveFileUrl(url: string, parentUrl?: string): Promise<string | undefined> {
    this.log(`Resolving ${url} at ${parentUrl ?? 'unknown'}`);
    const resolvedPath = await resolvePath(url, parentUrl);
    if (resolvedPath) {
      this.log(`Resolved to ${resolvedPath}`);
      const resolvedModule = await this.lookForExistingFilePath(resolvedPath);
      if (resolvedModule) {
        this.log(`Resolved to ${inspect(resolvedModule)}`);
        return pathToFileURL(resolvedModule).href;
      }
    }

    return undefined;
  }

  /**
   * Lookup for existing file path
   * @param filePath
   * @returns
   */
  protected async lookForExistingJsFilePath(filePath: string): Promise<string | undefined> {
    return (await existingFile(filePath)) ?? (this.allowDefaults ? lookForDefaultModule(filePath) : undefined);
  }

  protected async lookForExistingFilePath(filePath: string): Promise<string | undefined> {
    return (
      (await this.lookForExistingJsFilePath(filePath)) ??
      (this.allowDefaults ? lookForDefaultModule(filePath, '.ts') : undefined) ??
      lookForEsbuildReplacementFile(filePath)
    );
  }

  protected override _matchesEspecifier(specifier: string, context?: ResolveContext | undefined): boolean {
    return isFileSpecifier(specifier);
  }

  protected override async _resolve(
    specifier: string,
    context: ResolveContext,
    nextResolve?: NextResolve | undefined,
  ): Promise<ResolvedModule> {
    const resolvedModule = await this.resolveFileUrl(specifier, context.parentURL);
    if (resolvedModule) {
      if (nextResolve && !isEsbuildExtensionSupported(resolvedModule)) {
        return nextResolve(specifier, context);
      }

      return {
        url: resolvedModule,
        shortCircuit: true,
        format: detectFormatForEsbuildFileExtension(resolvedModule),
      };
    }

    throw new Error(`Module not found ${specifier}`);
  }

  protected override async _load(url: string, context: LoadContext, nextLoad?: NextLoad | undefined): Promise<LoadedModule> {
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

    return nextLoad!(url, context);
  }
}
