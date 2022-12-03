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
    if (this.handlesEspecifier(url)) {
      const returnValue = await this._getFormat(url, context, defaultGetFormat);
      if (returnValue) {
        return returnValue;
      }
    }

    return defaultGetFormat(url, context);
  }

  async _getFormat(url: string, context: Record<string, unknown>, defaultGetFormat: DefaultGetFormat): Promise<undefined | Node14Format> {
    return defaultGetFormat(url, context);
  }

  async getSource(url: string, context: Node14Format, defaultGetSource: DefaultGetSource): Promise<Node14Source> {
    if (this.handlesEspecifier(url)) {
      const returnValue = await this._getSource(url, context, defaultGetSource);
      if (returnValue) {
        return returnValue;
      }
    }

    return defaultGetSource(url, context);
  }

  async _getSource(url: string, context: Node14Format, defaultGetSource: DefaultGetSource): Promise<undefined | Node14Source> {
    return defaultGetSource(url, context);
  }

  async transformSource(
    source: SourceType,
    context: Node14TransformContext,
    defaultTransform: DefaultTransformSource,
  ): Promise<Node14Source> {
    if (this.handlesEspecifier(context.url)) {
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
    return defaultTransform(source, context);
  }
}
