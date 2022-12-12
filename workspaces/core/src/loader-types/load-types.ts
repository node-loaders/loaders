import { type Format } from './common-types.js';

export type LoadedModule = {
  format: Format;
  shortCircuit?: boolean;
  /**
   * Return source with null in case of responseURL
   */
  responseURL?: string;
  // eslint-disable-next-line @typescript-eslint/ban-types
  source: string | ArrayBuffer | ArrayBufferView | null;
};

export type LoadContext = {
  conditions: string[];
  format?: Format | undefined;
  importAssertions: Record<string, unknown>;
};

export type NextLoad = (url: string, context: LoadContext, nextLoad?: NextLoad) => Promise<LoadedModule>;
