import { builtinModules } from 'node:module';
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

export const isBuiltInModule = (module: string): boolean => builtinModules.includes(module) || isProtocol(module, nodeProtocol);

export const isPackageMapping = (specifier: string) => {
  const packageName = /^((@[^/]+\/)?[^/]+)/.exec(specifier);
  return packageName && packageName.length > 0 && validateNpmPackageName(packageName[0]).validForNewPackages;
};
