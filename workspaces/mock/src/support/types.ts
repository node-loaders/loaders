import { type cacheId } from './symbols-internal.js';

export type MockFactory<Target = any> = (...args: any[]) => Target;

export type MockedModule<MockedType = any> = {
  [cacheId]: boolean;
} & MockedType;

export type MockedIdData = {
  cacheId: string;
  specifier: string;
  resolvedSpecifier: string;
  depth: number;
  actual?: boolean;
};
