import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

import { transform } from '@esbuild-kit/core-utils';
import BaseLoader, {
  lookForDefaultModule,
  type LoadContext,
  type LoadedModule,
  type NextResolve,
  type NextLoad,
  type ResolveContext,
  type ResolvedModule,
} from '@node-loaders/core';
import { detectFormatForEsbuildFileExtension, detectFormatForEsbuildFilePath, isEsbuildExtensionSupported, lookForEsbuildReplacementFile } from './esbuild-module.js';

export default class EsbuildLoader extends BaseLoader {
  protected _matchesEspecifier(specifier: string, context?: ResolveContext | undefined): boolean {
    return true;
  }

  protected lookForModule(filePath: string): Promise<string | undefined> {
      return super.lookForModule(filePath) ?? lookForDefaultModule(filePath, '.ts') ?? lookForEsbuildReplacementFile(filePath);
  }

  protected async _resolve(specifier: string, context: ResolveContext, nextResolve?: NextResolve | undefined): Promise<ResolvedModule> {
    const existingFileUrl = await this.resolveModuleUrl(specifier, context.parentURL);
    if (existingFileUrl) {
      if (nextResolve && !isEsbuildExtensionSupported(existingFileUrl)) {
        return nextResolve(specifier, context);
      }

      return {
        url: existingFileUrl,
        shortCircuit: true,
        format: detectFormatForEsbuildFileExtension(existingFileUrl),
      };
    }

    throw new Error(`Module not found ${specifier}`);
  }

  protected async _load(url: string, context: LoadContext, nextLoad?: NextLoad | undefined): Promise<LoadedModule> {
    if (isEsbuildExtensionSupported(url)) {
      const filePath = fileURLToPath(url);
      const code = await readFile(filePath);
      const transformed = await transform(code.toString(), filePath);
      return {
        format: context.format ?? (await detectFormatForEsbuildFilePath(filePath)),
        source: transformed.code,
        shortCircuit: true,
      };
    }

    return nextLoad!(url, context);
  }
}
