import { type cacheId } from './symbols-internal.js';

export type MockedModule<MockedType = any> = {
  [cacheId]: boolean;
} & MockedType;

export type MockedIdData = {
  cacheId: string;
  specifier: string;
  resolvedSpecifier: string;
  depth: number;
};
