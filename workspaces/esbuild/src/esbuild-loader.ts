import { pathToFileURL } from 'node:url';

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
  specifierToFilePath,
} from '@node-loaders/core';
import { existingFile, lookForDefaultModule } from '@node-loaders/resolve';

import { detectFormatForEsbuildFileExtension, isEsbuildExtensionSupported, lookForEsbuildReplacementFile } from './esbuild-support.js';
import { EsbuildSources } from './esbuild-sources.js';

export type EsbuildLoaderOptions = LoaderBaseOptions & {
  allowDefaults?: boolean;
};

export default class EsbuildLoader extends LoaderBase {
  allowDefaults: boolean;
  esbuildSources = new EsbuildSources();

  constructor(options: EsbuildLoaderOptions = {}) {
    // We want builtin modules and package import to pass through
    super('esbuild', {
      forwardBuiltinSpecifiers: true,
      forwardPackageSpecifiers: true,
      forwardNodeModulesSpecifiers: true,
      // Libs can import a resolved development file.
      forwardNodeModulesParentSpecifiers: false,
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
      try {
        return await nextResolve(specifier, context);
      } catch (error: unknown) {
        const message = (error as any).message as string;
        const result = /'([^']*)'/.exec(message);
        if (result && result.length > 1) {
          specifier = result[1];
        }
      }
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
      const cachedfile = await this.esbuildSources.getSource(url, context.format);
      return {
        format: cachedfile.format,
        source: cachedfile.source,
        shortCircuit: true,
      };
    }

    return nextLoad(url, context);
  }
}
