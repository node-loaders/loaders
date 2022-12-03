import { builtinModules } from 'node:module';
import { isAbsolute } from 'node:path';
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

export const isPackageSpecifier = (specifier: string) => {
  if (isBuiltinModule(specifier)) {
    return false;
  }

  const packageName = /^((@[^/]+\/)?[^/]+)/.exec(specifier);
  return packageName !== null && packageName.length > 0 && validateNpmPackageName(packageName[0]).validForNewPackages;
};

export const isRelativeFileSpecifier = (specifier: string) => specifier.startsWith('.');

export const isFileSpecifier = (specifier: string) =>
  isRelativeFileSpecifier(specifier) || isPackageJsonImportSpecifier(specifier) || isAbsolute(specifier) || hasProtocol(specifier, 'file:');

export const isPackageJsonImportSpecifier = (specifier: string) => specifier.startsWith('#');
