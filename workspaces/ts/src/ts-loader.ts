import { extname } from 'node:path';
import { readFile } from 'node:fs/promises';

import { fileURLToPath } from 'node:url';
import { transform } from '@esbuild-kit/core-utils';
import BaseLoader from '@node-loaders/core';
import {
  type LoadContext,
  type LoadedModule,
  type NextResolve,
  type NextLoad,
  type ResolveContext,
  type ResolvedModule,
} from '@node-loaders/core';

class TSLoader extends BaseLoader {
  protected extensionsToFoward: string[] = ['.js', '.cjs', '.mjs'];
  protected typescriptExtensions: string[] = ['.ts', '.cts', '.mts'];

  protected _matchesEspecifier(specifier: string, context?: ResolveContext | undefined): boolean {
    return true;
  }

  protected async _resolve(specifier: string, context: ResolveContext, nextResolve?: NextResolve | undefined): Promise<ResolvedModule> {
    const existingFileUrl = await this.resolveExistingFileUrl(specifier, context.parentURL);
    if (existingFileUrl) {
      if (nextResolve && this.extensionsToFoward.includes(extname(existingFileUrl))) {
        return nextResolve(specifier, context);
      }

      return {
        url: existingFileUrl,
        shortCircuit: true,
        format: 'module',
      };
    }

    throw new Error(`Module not found ${specifier}`);
  }

  protected async _load(url: string, context: LoadContext, nextLoad?: NextLoad | undefined): Promise<LoadedModule> {
    const extension = extname(url);
    if (this.typescriptExtensions.includes(extension)) {
      const filePath = fileURLToPath(url);
      const code = await readFile(filePath);
      const transformed = await transform(code.toString(), filePath);
      return {
        format: extension === '.cts' ? 'commonjs' : 'module',
        source: transformed.code,
        shortCircuit: true,
      };
    }

    return nextLoad!(url, context);
  }
}

const routerLoader = new TSLoader();

export const resolve = routerLoader.exportResolve();

export const load = routerLoader.exportLoad();
