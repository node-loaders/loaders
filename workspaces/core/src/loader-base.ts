import { inspect } from 'node:util';
import { stat as fsStat, readdir } from 'node:fs/promises';
import { isAbsolute, basename, extname, join, dirname } from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';
import createDebug, { type Debugger } from 'debug';
import validateNpmPackageName from 'validate-npm-package-name';

import isBuiltIn from './built-in.js';
import { type LoadContext, type NextLoad, type LoadedModule, type NextResolve, type ResolveContext, type ResolvedModule } from './index.js';

export default class LoaderBase {
  protected matchBuiltIn: boolean;
  protected matchPackageName: boolean;
  protected log: Debugger = createDebug('@node-loaders');

  constructor(options?: { matchBuiltIn?: boolean; matchPackageName?: boolean }) {
    const { matchBuiltIn = false, matchPackageName = false } = options ?? {};

    this.matchBuiltIn = matchBuiltIn;
    this.matchPackageName = matchPackageName;
  }

  exportResolve() {
    return this.resolve.bind(this);
  }

  exportLoad() {
    return this.load.bind(this);
  }

  matchesEspecifier(specifier: string, context?: ResolveContext): boolean {
    this.log(`matchResolve ${specifier} with ${inspect(context)}`);
    if (!this.matchBuiltIn && isBuiltIn(specifier)) {
      this.log(`fowarding builtin ${specifier}`);
      return false;
    }

    if (!this.matchPackageName && validateNpmPackageName(specifier).validForNewPackages) {
      this.log(`fowarding package name ${specifier}`);
      return false;
    }

    return this._matchesEspecifier(specifier);
  }

  async resolve(specifier: string, context: ResolveContext, nextResolve?: NextResolve): Promise<ResolvedModule> {
    if (this.matchesEspecifier(specifier, context)) {
      return this._resolve(specifier, context, nextResolve);
    }

    return nextResolve!(specifier, this.transformResolveContext(context));
  }

  async load(url: string, context: LoadContext, nextLoad?: NextLoad): Promise<LoadedModule> {
    if (this.matchesEspecifier(url)) {
      return this._load(url, context, nextLoad);
    }

    return nextLoad!(url, context);
  }

  protected _matchesEspecifier(specifier: string, context?: ResolveContext) {
    return false;
  }

  protected async _resolve(specifier: string, context: ResolveContext, nextResolve?: NextResolve): Promise<ResolvedModule> {
    throw new Error('not implemented');
  }

  protected async _load(url: string, context: LoadContext, nextLoad?: NextLoad): Promise<LoadedModule> {
    throw new Error('not implemented');
  }

  protected transformResolveContext(context: ResolveContext) {
    return context;
  }

  protected async resolveExistingFileUrl(url: string, parentUrl?: string): Promise<string | undefined> {
    const resolvedPath = await this.resolvePath(url, parentUrl);
    if (resolvedPath) {
      const foundPath = await this.findFile(resolvedPath);
      if (foundPath.length > 0) {
        this.log(`Resolved to ${inspect(foundPath)}`);
        return pathToFileURL(foundPath[0]).href;
      }
    }

    return undefined;
  }

  protected async findFile(filePath: string): Promise<string[]> {
    const findFileInDir = async (directoryPath, filename) => {
      const list = await readdir(directoryPath);
      return list
        .filter(file => file.startsWith(`${filename}.`))
        .filter(file => filename === basename(file, extname(file)))
        .map(file => join(directoryPath, file));
    };

    try {
      const stat = await fsStat(filePath);
      if (stat.isFile()) {
        return [filePath];
      }

      if (stat.isDirectory()) {
        const list = await findFileInDir(filePath, 'index');
        if (list.length > 0) {
          return list;
        }
      }

      return [];
    } catch {}

    const list = await findFileInDir(dirname(filePath), basename(filePath, extname(filePath)));
    if (list.length > 0) {
      return list;
    }

    return [];
  }

  protected async resolvePath(url: string, parentUrl?: string) {
    this.log(`Resolving file ${url} at ${parentUrl}`);
    if (isAbsolute(url)) {
      return url;
    }

    try {
      return fileURLToPath(url);
    } catch {}

    if (url.startsWith('.') && parentUrl) {
      try {
        const parentPath = isAbsolute(parentUrl) ? parentUrl : fileURLToPath(parentUrl);
        return join(dirname(parentPath), url);
      } catch {}
    }

    return undefined;
  }
}
