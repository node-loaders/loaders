import Module from 'node:module';
import { pathToFileURL } from 'node:url';
import { lookForDefaultModuleSync, specifierToFilePath } from '@node-loaders/resolve';
import { EsbuildSources } from './esbuild-sources.js';
import { lookForEsbuildReplacementFileSync } from './esbuild-support.js';

const esbuildSources = new EsbuildSources();

type ResolveFilename = (
  request: string,
  parent: {
    filename: string | undefined;
  },
  isMain: boolean,
  options?: any,
) => string;

export default class EsbuildModuleResolver {
  extensions = ['.ts', '.tsx', '.jsx', '.cts'];

  extensionHandler(module: Module, fileUrl: string): void {
    const filePath = specifierToFilePath(fileUrl);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    (module as any)._compile(esbuildSources.getSourceSync(pathToFileURL(filePath).href).source, filePath);
  }

  // eslint-disable-next-line max-params
  resolveFilename(
    request: string,
    parent: {
      filename: string | undefined;
    },
    isMain: boolean,
    options: any,
    nextResolveFilename: ResolveFilename,
  ) {
    try {
      return nextResolveFilename(request, parent, isMain, options);
    } catch (error: unknown) {
      const filePath = specifierToFilePath(request, parent?.filename ?? undefined);
      const resolvedFilePath = lookForEsbuildReplacementFileSync(filePath) ?? lookForDefaultModuleSync(filePath, 'ts');
      if (resolvedFilePath) {
        return resolvedFilePath;
      }

      throw error;
    }
  }

  register() {
    for (const ext of this.extensions) {
      (Module as any)._extensions[ext] = this.extensionHandler;
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const nextResolveFilename = (Module as any)._resolveFilename;
    (Module as any)._resolveFilename = (request, parent, isMain, options) =>
      this.resolveFilename(request, parent, isMain, options, nextResolveFilename);
  }
}