import { type Format } from './common-types.js';

export type LoadedModule = {
  format: Format;
  shortCircuit?: boolean;
  source: string | ArrayBuffer | ArrayBufferView;
};

export type LoadContext = {
  conditions: string[];
  format?: Format | undefined;
  importAssertions: Record<string, unknown>;
};

export type NextLoad = (url: string, context: LoadContext, nextLoad?: NextLoad) => Promise<LoadedModule>;
