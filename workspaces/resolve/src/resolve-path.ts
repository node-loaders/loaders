import { readdir, stat as fsStat } from 'node:fs/promises';
import { basename, dirname, extname, isAbsolute, join } from 'node:path';
import { fileURLToPath } from 'node:url';

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
  try {
    const stat = await fsStat(filePath);
    if (stat.isDirectory()) {
      const indexFile = join(filePath, `${'index'}${extension}`);
      const statIndex = await fsStat(indexFile);
      if (statIndex.isFile()) {
        return indexFile;
      }
    }
  } catch {}

  try {
    const fileWithExtesion = `${filePath}${extension}`;
    const stat = await fsStat(fileWithExtesion);
    if (stat.isFile()) {
      return fileWithExtesion;
    }
  } catch {}

  return undefined;
};

/**
 * Look for the filePath with alternative extensions
 * @param filePath
 * @returns existing files with alternative extensions
 */
export const lookForAlternativeFiles = async (filePath: string): Promise<string[]> => {
  const extension = extname(filePath);
  const filename = basename(filePath, extension);
  const directoryPath = dirname(filePath);
  const list = await readdir(directoryPath);
  return list
    .filter(file => file.startsWith(`${filename}.`))
    .filter(file => basename(file, extname(file)) === filename)
    .map(file => join(directoryPath, file));
};