import { stat as fsStat } from 'node:fs/promises';
import { statSync } from 'node:fs';
import { dirname, extname, join } from 'node:path';
import { locatePath, locatePathSync } from 'locate-path';
import { readPackageUp, readPackageUpSync } from 'read-pkg-up';

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
 * Look for nearest package.json type field
 * @param filePath
 * @returns
 */
export function detectPackageJsonTypeSync(filePath: string): 'commonjs' | 'module' {
  const read = readPackageUpSync({ cwd: dirname(filePath) });
  return read!.packageJson.type ?? 'commonjs';
}

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
 * Check if the file exists
 * @param filePath
 * @returns the filePath if is a file and exists, undefined otherwise
 */
export const existingFileSync = (filePath: string): string | undefined => {
  try {
    const stat = statSync(filePath);
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
 * Look for file modules with the extension or index with extension if the passed filePath is a directory
 * @param filePath
 * @param extension
 * @returns the default filePath fallback if is found, undefined otherwise
 */
export const lookForDefaultModuleSync = (filePath: string, extension = '.js'): string | undefined => {
  return locatePathSync([join(filePath, `${'index'}${extension}`), `${filePath}${extension}`], { type: 'file' });
};

/**
 * Look for the filePath with alternative extensions
 * @param filePath
 * @returns existing files with alternative extensions
 */
export const resolveAlternativeFile = async (filePath: string, extensions: string[]): Promise<string | undefined> => {
  const extension = extname(filePath);
  const extensionLess = filePath.slice(0, -extension.length);
  return locatePath([filePath, ...extensions.map(alternative => `${extensionLess}${alternative}`)], { type: 'file' });
};

/**
 * Look for the filePath with alternative extensions
 * @param filePath
 * @returns existing files with alternative extensions
 */
export const resolveAlternativeFileSync = (filePath: string, extensions: string[]): string | undefined => {
  const extension = extname(filePath);
  const extensionLess = filePath.slice(0, -extension.length);
  return locatePathSync([filePath, ...extensions.map(alternative => `${extensionLess}${alternative}`)], { type: 'file' });
};
