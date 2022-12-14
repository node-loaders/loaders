import { builtinModules } from 'node:module';
import { dirname, isAbsolute, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import validateNpmPackageName from 'validate-npm-package-name';

const nodeProtocol = 'node:';
const nodeLoadersProtocol = 'node-loaders:';

const hasProtocol = (maybeUrl: string, protocol: string): boolean => {
  try {
    const myUrl = new URL(maybeUrl);
    return myUrl.protocol === protocol;
  } catch {
    return false;
  }
};

export const createCheckUrl = (name: string): string => `${nodeLoadersProtocol}//${name}`;

export const isCheckUrl = (url: string, name: string): boolean => createCheckUrl(name) === url;

export const isBuiltinModule = (module: string): boolean => builtinModules.includes(module) || hasProtocol(module, nodeProtocol);

export const normalizeNodeProtocol = (specifier: string) =>
  isBuiltinModule(specifier) && !hasProtocol(specifier, nodeProtocol) ? `${nodeProtocol}${specifier}` : specifier;

export const isPackageSpecifier = (specifier: string) => {
  if (isBuiltinModule(specifier)) {
    return false;
  }

  const packageName = /^((@[^/]+\/)?[^/]+)/.exec(specifier);
  return packageName !== null && packageName.length > 0 && validateNpmPackageName(packageName[0]).validForNewPackages;
};

export const isRelativeFileSpecifier = (specifier: string) => specifier.startsWith('.');

export const isPackageJsonImportSpecifier = (specifier: string) => specifier.startsWith('#');

export const isNodeModulesSpecifier = (specifier: string) => /[/\\]node_modules[/\\]/.test(specifier);

export const isFileProtocol = (specifier: string) => hasProtocol(specifier, 'file:');

export const isPathSpecifier = (specifier: string) => isRelativeFileSpecifier(specifier) || isAbsolute(specifier);

export const isFileSpecifier = (specifier: string) =>
  isPathSpecifier(specifier) || isPackageJsonImportSpecifier(specifier) || isFileProtocol(specifier);

/**
 * Convert driver letter to upper case on windows.
 * Node uses upper case letters, source-maps/stack traces are generated with lower case.
 * Convert to upper case otherwise they are considered different files/modules.
 * @param url
 * @returns
 */
export const convertUrlDriveLetterToUpperCase = (url: string): string => {
  if (/^file:\/{3}\w:/.test(url)) {
    return `${url.slice(0, 8)}${url.slice(8, 9).toUpperCase()}${url.slice(9)}`;
  }

  return url;
};

export const asCjsSpecifier = (specifier: string): string =>
  isFileProtocol(specifier)
    ? fileURLToPath(specifier)
    : hasProtocol(specifier, nodeProtocol)
    ? specifier.slice(nodeProtocol.length)
    : specifier;

export const asEsmSpecifier = (specifier: string): string =>
  isAbsolute(specifier)
    ? pathToFileURL(specifier).href
    : isBuiltinModule(specifier) && !hasProtocol(specifier, nodeProtocol)
    ? `${nodeProtocol}${specifier}`
    : specifier;

/**
 * Resolves a file specifier to a file path
 * @param specifier accepts an absolute path, an relative path or and file url
 * @param parentURL required for relative specifier, ignored otherwise
 * @returns resolved file path
 */
export const specifierToFilePath = (specifier: string, parentURL?: string): string => {
  if (isAbsolute(specifier)) {
    return specifier;
  }

  if (specifier.startsWith('.')) {
    if (!parentURL) {
      throw new Error(`Error resolving module ${specifier} without a parentUrl`);
    }

    return join(dirname(fileURLToPath(parentURL)), specifier);
  }

  return fileURLToPath(specifier);
};
