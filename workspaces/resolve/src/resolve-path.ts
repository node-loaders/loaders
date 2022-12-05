import { stat as fsStat } from 'node:fs/promises';
import { dirname, extname, isAbsolute, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { locatePath } from 'locate-path';
import { readPackageUp } from 'read-pkg-up';

/**
 * Look for nearest package.json type field
 * @param filePath
 * @returns
 */
export async function detectPackageJsonType(filePath: string): Promise<'commonjs' | 'module'> {
  const read = await readPackageUp({ cwd: dirname(filePath) });
  return read!.packageJson.type ?? 'commonjs';
}

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

/**
 * Check if the file exists
 * @param filePath
 * @returns the filePath if is a file and exists, undefined otherwise
 */
export const existingFile = async (filePath: string): Promise<string | undefined> => {
  try {
    const stat = await fsStat(filePath);
    return stat.isFile() ? filePath : undefined;
  } catch {}

  return undefined;
};

/**
 * Look for file modules with the extension or index with extension if the passed filePath is a directory
 * @param filePath
 * @param extension
 * @returns the default filePath fallback if is found, undefined otherwise
 */
export const lookForDefaultModule = async (filePath: string, extension = '.js'): Promise<string | undefined> => {
  return locatePath([join(filePath, `${'index'}${extension}`), `${filePath}${extension}`], { type: 'file' });
};

/**
 * Look for the filePath with alternative extensions
 * @param filePath
 * @returns existing files with alternative extensions
 */
export const resolveAlternativeFile = async (filePath: string, extensions: string[]): Promise<string | undefined> => {
  const extension = extname(filePath);
  const extensionLess = filePath.slice(0, -extension.length);
  return locatePath(
    extensions.map(alternative => `${extensionLess}${alternative}`),
    { type: 'file' },
  );
};
