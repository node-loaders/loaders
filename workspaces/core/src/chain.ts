import { type Loader } from './index.js';

export type LoaderNext = (arg1: unknown, arg2: unknown) => Promise<unknown>;
export type LoaderFunction = (arg1: unknown, arg2: unknown, arg3?: LoaderNext) => Promise<unknown>;

export function createChainMethod<PropName extends 'resolve' | 'load'>(list: Loader[], property: PropName) {
  return (identifier, context, next: LoaderNext): unknown => {
    const functions = list.map(loader => loader[property]).filter(Boolean) as LoaderFunction[];
    const last: LoaderFunction = async (arg1, arg2, arg3) => next(arg1, arg2);
    const chain = createChain(...functions, last);
    return chain(identifier, context);
  };
}

export const createChain = (...functions: LoaderFunction[]): LoaderNext => {
  if (functions.length === 0) {
    throw new Error('At least 1 method is required');
  }

  let next = functions.pop()!;
  while (functions.length > 0) {
    const temporary = next;
    const last = functions.pop()!;

    next = async (arg1, arg2) => last(arg1, arg2, temporary);
  }

  return next;
};
