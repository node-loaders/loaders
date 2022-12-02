import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

import { transform, installSourceMapSupport } from '@esbuild-kit/core-utils';
import BaseLoader, {
  lookForDefaultModule,
  type LoadContext,
  type LoadedModule,
  type NextResolve,
  type NextLoad,
  type ResolveContext,
  type ResolvedModule,
  isFileSpecifier,
} from '@node-loaders/core';
import {
  detectFormatForEsbuildFileExtension,
  detectFormatForEsbuildFilePath,
  isEsbuildExtensionSupported,
  lookForEsbuildReplacementFile,
} from './esbuild-module.js';

export default class EsbuildLoader extends BaseLoader {
  protected _matchesEspecifier(specifier: string, context?: ResolveContext | undefined): boolean {
    return isFileSpecifier(specifier);
  }

  protected override async lookForModule(filePath: string): Promise<string | undefined> {
    return (
      (await super.lookForModule(filePath)) ??
      (this.allowDefaults ? lookForDefaultModule(filePath, '.ts') : undefined) ??
      lookForEsbuildReplacementFile(filePath)
    );
  }

  protected override async _resolve(
    specifier: string,
    context: ResolveContext,
    nextResolve?: NextResolve | undefined,
  ): Promise<ResolvedModule> {
    const resolvedModule = await this.resolveModuleUrl(specifier, context.parentURL);
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
