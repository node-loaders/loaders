import { inspect } from 'node:util';
import createDebug, { type Debugger } from 'debug';
import { isBuiltinModule, isPackageSpecifier } from './specifier.js';

import { type LoadContext, type NextLoad, type LoadedModule, type NextResolve, type ResolveContext, type ResolvedModule } from './index.js';

export type LoaderBaseOptions = {
  matchBuiltinSpecifier?: boolean;
  matchPackageSpecifier?: boolean;
};

export default class LoaderBase {
  protected matchBuiltinSpecifier: boolean;
  protected matchPackageSpecifier: boolean;

  protected log: Debugger;

  constructor(options: LoaderBaseOptions = {}) {
    const { matchBuiltinSpecifier = true, matchPackageSpecifier = true } = options;

    this.matchBuiltinSpecifier = matchBuiltinSpecifier;
    this.matchPackageSpecifier = matchPackageSpecifier;
    this.log = createDebug(`@node-loaders:${this.constructor.name}`);
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
    if (!this.matchBuiltinSpecifier && isBuiltinModule(specifier)) {
      return false;
    }

    if (!this.matchPackageSpecifier && isPackageSpecifier(specifier)) {
      return false;
    }

    return this._matchesEspecifier(specifier, context);
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
    if (!nextResolve) {
      throw new Error(`Error resolving ${specifier} at ${context.parentURL ?? 'unknown'}, nextResolve is required for chaining`);
    }

    if (this.matchesEspecifier(specifier, context)) {
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
    if (!nextLoad) {
      throw new Error(`Error loading ${url}, nextLoad is required for chaining`);
    }

    if (this.matchesEspecifier(url)) {
      this.log(`Handling load url ${url}`);
      return this._load(url, context, nextLoad);
    }

    this.log(`Fowarding load url ${url}`);
    return nextLoad(url, context);
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

type SourceType = string | SharedArrayBuffer | Uint8Array;

type Node14Format = {
  format: string;
};

type Node14Source = {
  source: SourceType;
};

type Node14TransformContext = Node14Format & { url: string };

type DefaultGetFormat = (url: string, context: Record<string, unknown>) => Promise<Node14Format>;

type DefaultGetSource = (url: string, context: Node14Format) => Promise<Node14Source>;

type DefaultTransformSource = (source: SourceType, context: Node14TransformContext) => Promise<Node14Source>;

export class Node14Loader extends LoaderBase {
  exportGetFormat() {
    return this.getFormat.bind(this);
  }

  exportGetSource() {
    return this.getSource.bind(this);
  }

  exportTransformSource() {
    return this.transformSource.bind(this);
  }

  async getFormat(url: string, context: Record<string, unknown>, defaultGetFormat: DefaultGetFormat): Promise<Node14Format> {
    if (this.matchesEspecifier(url)) {
      const returnValue = await this._getFormat(url, context, defaultGetFormat);
      if (returnValue) {
        return returnValue;
      }
    }

    return defaultGetFormat(url, context);
  }

  async _getFormat(url: string, context: Record<string, unknown>, defaultGetFormat: DefaultGetFormat): Promise<undefined | Node14Format> {
    throw new Error('Not implemented');
  }

  async getSource(url: string, context: Node14Format, defaultGetSource: DefaultGetSource): Promise<Node14Source> {
    if (this.matchesEspecifier(url)) {
      const returnValue = await this._getSource(url, context, defaultGetSource);
      if (returnValue) {
        return returnValue;
      }
    }

    return defaultGetSource(url, context);
  }

  async _getSource(url: string, context: Node14Format, defaultGetSource: DefaultGetSource): Promise<undefined | Node14Source> {
    throw new Error('Not implemented');
  }

  async transformSource(
    source: SourceType,
    context: Node14TransformContext,
    defaultTransform: DefaultTransformSource,
  ): Promise<Node14Source> {
    if (this.matchesEspecifier(context.url)) {
      const returnValue = await this._transformSource(source, context, defaultTransform);
      if (returnValue) {
        return returnValue;
      }
    }

    return defaultTransform(source, context);
  }

  async _transformSource(
    source: SourceType,
    context: Node14TransformContext,
    defaultTransform: DefaultTransformSource,
  ): Promise<undefined | Node14Source> {
    throw new Error('Not implemented');
  }
}
