import { inspect } from 'node:util';
import createDebug, { type Debugger } from 'debug';
import { isBuiltinModule, isPackageSpecifier } from './specifier.js';

import { type LoadContext, type NextLoad, type LoadedModule, type NextResolve, type ResolveContext, type ResolvedModule } from './index.js';

export type LoaderBaseOptions = {
  matchBuiltin?: boolean;
  matchPackageName?: boolean;
  allowDefaults?: boolean;
};

export default class LoaderBase {
  protected matchBuiltin: boolean;
  protected matchPackageName: boolean;
  protected allowDefaults: boolean;

  protected log: Debugger = createDebug('@node-loaders');

  constructor(options?: LoaderBaseOptions) {
    const { matchBuiltin = true, matchPackageName = true, allowDefaults = false } = options ?? {};

    this.allowDefaults = allowDefaults;
    this.matchBuiltin = matchBuiltin;
    this.matchPackageName = matchPackageName;
  }

  exportResolve() {
    return this.resolve.bind(this);
  }

  exportLoad() {
    return this.load.bind(this);
  }

  /**
   * Default filter implementation
   * @param specifier
   * @param context
   * @returns
   */
  matchesEspecifier(specifier: string, context?: ResolveContext): boolean {
    this.log(`matchResolve ${specifier} with ${inspect(context)}`);
    if (!this.matchBuiltin && isBuiltinModule(specifier)) {
      this.log(`fowarding builtin ${specifier}`);
      return false;
    }

    if (!this.matchPackageName && isPackageSpecifier(specifier)) {
      this.log(`fowarding package name ${specifier}`);
      return false;
    }

    return this._matchesEspecifier(specifier);
  }

  /**
   * Filters the call and forwards to _resolve
   * @param specifier
   * @param context
   * @param nextResolve
   * @returns
   */
  async resolve(specifier: string, context: ResolveContext, nextResolve?: NextResolve): Promise<ResolvedModule> {
    if (!nextResolve) {
      throw new Error(`Error resolving ${specifier} at ${context.parentURL ?? 'unknown'}, nextResolve is required for chaining`);
    }
    if (this.matchesEspecifier(specifier, context)) {
      return this._resolve(specifier, context, nextResolve);
    }

    return nextResolve!(specifier, context);
  }

  /**
   * Filters the call and forwards to _load
   * @param url
   * @param context
   * @param nextLoad
   * @returns
   */
  async load(url: string, context: LoadContext, nextLoad?: NextLoad): Promise<LoadedModule> {
    if (!nextLoad) {
      throw new Error(`Error loading ${url}, nextLoad is required for chaining`);
    }
    if (this.matchesEspecifier(url)) {
      return this._load(url, context, nextLoad);
    }

    return nextLoad!(url, context);
  }

  protected _matchesEspecifier(specifier: string, context?: ResolveContext) {
    return false;
  }

  /**
   * Unfiltered resolve
   * @param specifier
   * @param context
   * @param nextResolve
   */
  protected async _resolve(specifier: string, context: ResolveContext, nextResolve: NextResolve): Promise<ResolvedModule> {
    throw new Error('not implemented');
  }

  /**
   * Unfiltered load
   * @param url
   * @param context
   * @param nextLoad
   */
  protected async _load(url: string, context: LoadContext, nextLoad: NextLoad): Promise<LoadedModule> {
    throw new Error('not implemented');
  }
}
