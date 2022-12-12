/* c8 ignore start */
import { inspect } from 'node:util';

import LoaderBase from './loader-base.js';
import { isCheckUrl } from './specifier.js';
import { type Format, type LoadContext } from './index.js';

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

type Constructor<Foo extends LoaderBase> = new (...args: any[]) => Foo;

export function addNode14Support<Parent extends Constructor<LoaderBase>>(parent: Parent) {
  return class WithNode14Loader extends parent {
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
      if (isCheckUrl(url, this.name)) {
        this.log(`Fowarding node loader check ${url}`);
        return {
          format: 'module',
        };
      }

      if (this.handlesEspecifier(url)) {
        this.log(`Handling getFormat url ${url}, ${inspect(context)}`);
        const returnValue = await this._getFormat(url, context, defaultGetFormat);
        if (returnValue) {
          return returnValue;
        }
      }

      this.log(`Forwarding getFormat url ${url}, ${inspect(context)}`);
      return defaultGetFormat(url, context);
    }

    async _getFormat(url: string, context: Record<string, unknown>, defaultGetFormat: DefaultGetFormat): Promise<undefined | Node14Format> {
      return defaultGetFormat(url, context);
    }

    async getSource(url: string, context: Node14Format, defaultGetSource: DefaultGetSource): Promise<Node14Source> {
      if (isCheckUrl(url, this.name)) {
        this.log(`Generating ${url}`);
        return {
          source: 'export default true;',
        };
      }

      if (this.handlesEspecifier(url)) {
        this.log(`Handling getSource url ${url}, ${inspect(context)}`);
        const returnValue = await this._getSource(url, context, defaultGetSource);
        if (returnValue) {
          return returnValue;
        }
      }

      this.log(`Forwarding getSource url ${url}, ${inspect(context)}`);
      return defaultGetSource(url, context);
    }

    // Pass to _load by default
    async _getSource(
      url: string,
      context: { format: string },
      defaultGetSource: (url: string, context: { format: string }) => Promise<{ source: string | SharedArrayBuffer | Uint8Array }>,
    ): Promise<{ source: string }> {
      // eslint-disable-next-line @typescript-eslint/ban-types
      const asSourceString = (loadedModule: { source: string | SharedArrayBuffer | Uint8Array | ArrayBuffer | ArrayBufferView | null }) => {
        if (loadedModule.source === null) {
          throw new Error('LoadedModule passthrought is not supported on node v14');
        }

        // eslint-disable-next-line @typescript-eslint/no-base-to-string
        return { source: loadedModule.source.toString() };
      };

      return asSourceString(
        await this._load(
          url,
          { format: context.format as Format, importAssertions: {}, conditions: [] },
          async (nextUrl: string, nextContext: LoadContext) => {
            const { source } = asSourceString(await defaultGetSource(nextUrl, { format: nextContext.format! }));
            return { source, format: nextContext.format! };
          },
        ),
      );
    }

    async transformSource(
      source: SourceType,
      context: Node14TransformContext,
      defaultTransform: DefaultTransformSource,
    ): Promise<Node14Source> {
      if (this.handlesEspecifier(context.url)) {
        this.log(`Handling transformSource url ${inspect(context)}`);
        const returnValue = await this._transformSource(source, context, defaultTransform);
        if (returnValue) {
          return returnValue;
        }
      }

      this.log(`Forwarding transformSource url ${inspect(context)}`);
      return defaultTransform(source, context);
    }

    async _transformSource(
      source: SourceType,
      context: Node14TransformContext,
      defaultTransform: DefaultTransformSource,
    ): Promise<undefined | Node14Source> {
      return defaultTransform(source, context);
    }
  };
}

export default class Node14Loader extends addNode14Support(LoaderBase) {}
/* c8 ignore stop */
