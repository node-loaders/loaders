import { existsSync, readFileSync } from 'node:fs';
import { resolve as pathResolve } from 'node:path';
import { type NextResolve, type NextLoad } from '@node-loaders/core';

export type LoaderRoute = {
  matchSpecifier?: string | RegExp;
  matchParent?: string;
  resolve: NextResolve;
  load: NextLoad;
};

export type LoadersConfig = {
  routes?: Record<string, LoaderRoute>;
  fallback?: LoaderRoute;
};

const tryLoadJsFile = async (jsFile): Promise<LoadersConfig | undefined> => {
  if (existsSync(jsFile)) {
    try {
      const configFile = await import(jsFile);
      return configFile.default;
    } catch {}
  }

  return undefined;
};

const tryLoadJsonFile = async (jsonFile): Promise<LoadersConfig | undefined> => {
  if (existsSync(jsonFile)) {
    try {
      return JSON.parse(readFileSync(jsonFile).toString());
    } catch {}
  }

  return undefined;
};

const parseConfig = async (config: any = {}): Promise<LoadersConfig> => {
  let { fallback } = config;
  if (typeof fallback === 'string') {
    fallback = await import(fallback);
  }

  return { ...config, fallback };
};

export async function resolveConfig(): Promise<LoadersConfig> {
  console.log('resolving config');
  return parseConfig(
    (await tryLoadJsFile(pathResolve(process.cwd(), 'node-loaders.mjs'))) ??
      (await tryLoadJsFile(pathResolve(process.cwd(), 'node-loaders.js'))) ??
      (await tryLoadJsonFile(pathResolve(process.cwd(), 'node-loaders.json'))),
  );
}
