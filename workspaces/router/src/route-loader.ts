import { inspect } from 'node:util';
import { type Debugger } from 'debug';
import { type LoaderRoute, resolveConfig } from './config.js';
import BaseLoader, {
  type LoadContext,
  type LoadedModule,
  type NextLoad,
  type NextResolve,
  type ResolveContext,
  type ResolvedModule,
  isBuiltIn,
} from '@node-loaders/core';

let log: Debugger;
try {
  const createDebug = (await import('debug')).default;
  log = createDebug('@node-loaders');
} finally {
}

const ROUTE_SEARCH_PARAM = '@node-loaders/route';

const config = await resolveConfig();

export const cachedRoutes: Record<string, LoaderRoute> = {};
global['@node-loaders'] = {
  cachedRoutes,
};

const getRoutes = () => ({ ...cachedRoutes, ...config.routes });

const logResolved = (resolved: ResolvedModule): ResolvedModule => {
  log?.(`Resolved ${inspect(resolved)}`);
  return resolved;
};

const logLoaded = (loaded: LoadedModule): LoadedModule => {
  log?.(`Loaded ${inspect(loaded)}`);
  return loaded;
};

const addRoute = (url: string, route: string) => {
  const myUrl = new URL(url);
  myUrl.searchParams.set(ROUTE_SEARCH_PARAM, route);
  return myUrl.href;
};

const getRoute = (url: string) => {
  const myUrl = new URL(url);
  return myUrl.searchParams.get(ROUTE_SEARCH_PARAM);
};

const removeRoute = (url: string) => {
  const myUrl = new URL(url);
  myUrl.searchParams.delete(ROUTE_SEARCH_PARAM);
  return myUrl.href;
};

const getLoaderForRoute = (route: string): LoaderRoute => (route === 'fallback' ? config.fallback! : getRoutes()[route]);

const matchRoute = (route: string, specifier: string, context: ResolveContext): boolean => {
  const loader = getLoaderForRoute(route);
  if (loader.matchParent && loader.matchParent === context.parentURL && loader.matchSpecifier === specifier) {
    return true;
  }

  return false;
};

const loadWithRoute = async (route: string, url: string, context: LoadContext, nextLoad?: NextLoad) => {
  return getLoaderForRoute(route).load(url, context, nextLoad);
};

class RouterLoader extends BaseLoader {
  protected _matchesEspecifier(url: string): boolean {
    return true;
  }

  protected async _resolve(specifier: string, context: ResolveContext, nextResolve?: NextResolve | undefined): Promise<ResolvedModule> {
    this.log(`Resolving ${specifier} with ${inspect(context)}`);
    const resolved = await this.resolveWithRoutes(Object.keys(getRoutes()), specifier, context, nextResolve);
    if (resolved) {
      return resolved;
    }

    const parentRoute = context.parentURL ? getRoute(context.parentURL) : undefined;
    if (parentRoute) {
      context = { ...context, parentURL: removeRoute(context.parentURL!) };
      return this.resolveWithRoute(parentRoute, specifier, context, nextResolve);
    }

    try {
      if (nextResolve) {
        const resolved = await nextResolve(specifier, context);
        logResolved(resolved);
        // Non builtin modules has a format
        if (resolved.format) {
          return logResolved(resolved);
        }
      }
    } catch {}

    if (config.fallback) {
      this.log(`Using resolve fallback for ${specifier}`);
      return this.resolveWithRoute('fallback', specifier, context, nextResolve);
    }

    throw new Error(`Module not found ${specifier}`);
  }

  protected async _load(url: string, context: LoadContext, nextLoad?: NextLoad | undefined): Promise<LoadedModule> {
    this.log(`Loading ${url} with ${inspect(context)}`);
    if (isBuiltIn(url) && nextLoad) {
      return nextLoad(url, context);
    }

    const route = getRoute(url);
    if (route) {
      const cleanUrl = removeRoute(url);
      log?.(`Route '${route}' removed from url ${cleanUrl}`);
      if (route) {
        return logLoaded(await loadWithRoute(route, cleanUrl, context, nextLoad));
      }
    }

    return logLoaded(await nextLoad!(url, context));
  }

  protected async resolveWithRoute(route: string, specifier: string, context: ResolveContext, nextResolve?: NextResolve) {
    const resolved = await getLoaderForRoute(route).resolve(specifier, context, nextResolve);
    return {
      ...resolved,
      url: addRoute(resolved.url, route),
    };
  }

  protected async resolveWithRoutes(routes: string[], specifier: string, context: ResolveContext, nextResolve?: NextResolve) {
    const [route, ...nextRoutes] = routes;
    if (!route) {
      return undefined;
    }

    if (matchRoute(route, specifier, context)) {
      return this.resolveWithRoute(route, specifier, context, (specifier, context) =>
        this.resolveWithRoutes(nextRoutes, specifier, context, nextResolve),
      );
    }

    if (nextRoutes.length === 0) {
      return undefined;
    }

    return this.resolveWithRoutes(nextRoutes, specifier, context, nextResolve);
  }
}

const routerLoader = new RouterLoader();

export async function resolve(specifier: string, context: ResolveContext, nextResolve?: NextResolve): Promise<ResolvedModule> {
  return routerLoader.resolve(specifier, context, nextResolve);
}

export async function load(url: string, context: LoadContext, nextLoad?: NextLoad): Promise<LoadedModule> {
  return routerLoader.load(url, context, nextLoad);
}
