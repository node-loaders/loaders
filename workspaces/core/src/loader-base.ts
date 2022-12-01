import { inspect } from 'node:util';
import { pathToFileURL } from 'node:url';
import createDebug, { type Debugger } from 'debug';
import { isBuiltInModule, isPackageMapping } from './detect-module.js';

import { lookForDefaultModule, resolvePath } from './resolve-module.js';
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
    if (!this.matchBuiltIn && isBuiltInModule(specifier)) {
      this.log(`fowarding builtin ${specifier}`);
      return false;
    }

    if (!this.matchPackageName && isPackageMapping(specifier)) {
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

  protected async resolveModuleUrl(url: string, parentUrl?: string): Promise<string | undefined> {
    this.log(`Resolving file ${url} at ${parentUrl ?? 'unknown'}`);
    const resolvedPath = await resolvePath(url, parentUrl);
    if (resolvedPath) {
      const resolvedModule = await this.lookForModule(resolvedPath);
      if (resolvedModule) {
        this.log(`Resolved to ${inspect(resolvedModule)}`);
        return pathToFileURL(resolvedModule).href;
      }
    }

    return undefined;
  }

  protected async lookForModule(filePath: string): Promise<string | undefined> {
    return lookForDefaultModule(filePath);
  }
}
