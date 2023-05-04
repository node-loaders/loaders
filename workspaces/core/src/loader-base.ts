import { inspect } from 'node:util';
import { isBuiltinModule, isPackageSpecifier, isCheckUrl, isNodeModulesSpecifier } from './specifier.js';
import { type LoadContext, type Load, type LoadedModule, type Resolve, type ResolveContext, type ResolvedModule } from './index.js';

export type LoaderBaseOptions = {
  forwardBuiltinSpecifiers?: boolean;
  forwardPackageSpecifiers?: boolean;
  forwardNodeModulesSpecifiers?: boolean;
  forwardNodeModulesParentSpecifiers?: boolean;
};

export type Loader = {
  resolve: Resolve;
  load: Load;
};

export default class LoaderBase implements Loader {
  readonly name: string;
  readonly forwardBuiltinSpecifiers: boolean;
  readonly forwardPackageSpecifiers: boolean;
  readonly forwardNodeModulesSpecifiers: boolean;
  readonly forwardNodeModulesParentSpecifiers: boolean;
  log?: (...args: any[]) => void;

  constructor(name?: string, options: LoaderBaseOptions = {}) {
    const {
      forwardBuiltinSpecifiers = false,
      forwardPackageSpecifiers = false,
      forwardNodeModulesSpecifiers = false,
      forwardNodeModulesParentSpecifiers = false,
    } = options;

    this.name = name ?? this.constructor.name;
    this.forwardBuiltinSpecifiers = forwardBuiltinSpecifiers;
    this.forwardPackageSpecifiers = forwardPackageSpecifiers;
    this.forwardNodeModulesSpecifiers = forwardNodeModulesSpecifiers;
    this.forwardNodeModulesParentSpecifiers = forwardNodeModulesParentSpecifiers;

    import('debug').then(
      debug => {
        this.log = debug.default(`@node-loaders:${this.name}`);
      },
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      () => {},
    );
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

    if (this.forwardNodeModulesSpecifiers && isNodeModulesSpecifier(specifier)) {
      return false;
    }

    if (this.forwardNodeModulesParentSpecifiers && context?.parentURL && isNodeModulesSpecifier(context.parentURL)) {
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
  async resolve(specifier: string, context: ResolveContext, nextResolve?: Resolve): Promise<ResolvedModule> {
    this.log?.(`Start resolving ${specifier} with ${inspect(context)}`);
    if (isCheckUrl(specifier, this.name)) {
      this.log?.(`Fowarding node loader check ${specifier}`);
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
      this.log?.(`Handling resolve specifier ${specifier}`);
      return this._resolve(specifier, context, nextResolve);
    }

    this.log?.(`Fowarding resolve specifier ${specifier}`);
    return nextResolve(specifier, context);
  }

  /**
   * Filter calls and forwards to _load
   * @param url
   * @param context
   * @param nextLoad
   * @returns
   */
  async load(url: string, context: LoadContext, nextLoad?: Load): Promise<LoadedModule> {
    this.log?.(`Start loading ${url}`);
    if (isCheckUrl(url, this.name)) {
      this.log?.(`Generating ${url}`);
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
      this.log?.(`Handling load url ${url}`);
      return this._load(url, context, nextLoad);
    }

    this.log?.(`Fowarding load url ${url}`);
    return nextLoad(url, context);
  }

  _handlesEspecifier(specifier: string, context?: ResolveContext) {
    return false;
  }

  /**
   * Unfiltered resolve
   * @param specifier
   * @param context
   * @param nextResolve
   */
  async _resolve(specifier: string, context: ResolveContext, nextResolve: Resolve): Promise<ResolvedModule> {
    throw new Error('not implemented');
  }

  /**
   * Unfiltered load
   * @param url
   * @param context
   * @param nextLoad
   */
  async _load(url: string, context: LoadContext, nextLoad: Load): Promise<LoadedModule> {
    throw new Error('not implemented');
  }
}
