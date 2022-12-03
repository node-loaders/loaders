import { inspect } from 'node:util';
import createDebug, { type Debugger } from 'debug';
import { isBuiltinModule, isPackageSpecifier, isCheckUrl } from './specifier.js';

import { type LoadContext, type NextLoad, type LoadedModule, type NextResolve, type ResolveContext, type ResolvedModule } from './index.js';

export type LoaderBaseOptions = {
  forwardBuiltinSpecifiers?: boolean;
  forwardPackageSpecifiers?: boolean;
};

export default class LoaderBase {
  protected readonly name: string;
  protected readonly forwardBuiltinSpecifiers: boolean;
  protected readonly forwardPackageSpecifiers: boolean;

  protected readonly log: Debugger;

  constructor(name?: string, options: LoaderBaseOptions = {}) {
    const { forwardBuiltinSpecifiers = false, forwardPackageSpecifiers = false } = options;

    this.name = name ?? this.constructor.name;
    this.forwardBuiltinSpecifiers = forwardBuiltinSpecifiers;
    this.forwardPackageSpecifiers = forwardPackageSpecifiers;
    this.log = createDebug(`@node-loaders:${this.name}`);
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
  handlesEspecifier(specifier: string, context?: ResolveContext): boolean {
    if (this.forwardBuiltinSpecifiers && isBuiltinModule(specifier)) {
      return false;
    }

    if (this.forwardPackageSpecifiers && isPackageSpecifier(specifier)) {
      return false;
    }

    return this._handlesEspecifier(specifier, context);
  }

  /**
   * Filter calls and forwards to _resolve
   * @param specifier
   * @param context
   * @param nextResolve
   * @returns
   */
  async resolve(specifier: string, context: ResolveContext, nextResolve?: NextResolve): Promise<ResolvedModule> {
    this.log(`Start resolving ${specifier} with ${inspect(context)}`);
    if (isCheckUrl(specifier, this.name)) {
      this.log(`Fowarding node loader check ${specifier}`);
      return {
        url: specifier,
        format: 'module',
        shortCircuit: true,
      };
    }

    if (!nextResolve) {
      throw new Error(`Error resolving ${specifier} at ${context.parentURL ?? 'unknown'}, nextResolve is required for chaining`);
    }

    if (this.handlesEspecifier(specifier, context)) {
      this.log(`Handling resolve specifier ${specifier}`);
      return this._resolve(specifier, context, nextResolve);
    }

    this.log(`Fowarding resolve specifier ${specifier}`);
    return nextResolve(specifier, context);
  }

  /**
   * Filter calls and forwards to _load
   * @param url
   * @param context
   * @param nextLoad
   * @returns
   */
  async load(url: string, context: LoadContext, nextLoad?: NextLoad): Promise<LoadedModule> {
    this.log(`Start loading ${url}`);
    if (isCheckUrl(url, this.name)) {
      this.log(`Generating ${url}`);
      return {
        source: 'export default true;',
        format: 'module',
        shortCircuit: true,
      };
    }

    if (!nextLoad) {
      throw new Error(`Error loading ${url}, nextLoad is required for chaining`);
    }

    if (this.handlesEspecifier(url)) {
      this.log(`Handling load url ${url}`);
      return this._load(url, context, nextLoad);
    }

    this.log(`Fowarding load url ${url}`);
    return nextLoad(url, context);
  }

  protected _handlesEspecifier(specifier: string, context?: ResolveContext) {
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
