import LoaderBase from "./loader-base.js";
import { isCheckUrl } from "./specifier.js";

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

export default class Node14Loader extends LoaderBase {
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
    if (isCheckUrl(url, this.name)) {
      this.log(`Generating ${url}`);
      return {
        source: 'export default true;',
      };
    }

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
