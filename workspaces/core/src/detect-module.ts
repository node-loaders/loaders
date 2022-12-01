import { builtinModules } from 'node:module';
import { isAbsolute } from 'node:path';
import validateNpmPackageName from 'validate-npm-package-name';

const nodeProtocol = 'node:';

const isProtocol = (maybeUrl: string, protocol: string): boolean => {
  try {
    const myUrl = new URL(maybeUrl);
    return myUrl.protocol === protocol;
  } catch {
    return false;
  }
};

export const isBuiltinModule = (module: string): boolean => builtinModules.includes(module) || isProtocol(module, nodeProtocol);

export const isPackageMapping = (specifier: string) => {
  if (isBuiltinModule(specifier)) {
    return false;
  }

  const packageName = /^((@[^/]+\/)?[^/]+)/.exec(specifier);
  return packageName !== null && packageName.length > 0 && validateNpmPackageName(packageName[0]).validForNewPackages;
};

export const isFileModule = (specifier: string) => {
  return specifier.startsWith('.') || specifier.startsWith('#') || isAbsolute(specifier) || isProtocol(specifier, 'file:');
};
