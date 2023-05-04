import { type Format } from './common-types.js';

export type ResolveContext = {
  conditions: string[];
  importAssertions: Record<string, unknown>;
  parentURL?: string;
};

export type ResolvedModule = {
  format?: Format | undefined;
  shortCircuit?: boolean;
  url: string;
};

export type Resolve = (url: string, context: ResolveContext, nextResolve?: Resolve) => Promise<ResolvedModule>;
