import { readdir, stat as fsStat } from 'node:fs/promises';
import { basename, dirname, extname, isAbsolute, join } from 'node:path';
import { fileURLToPath } from 'node:url';

export const resolvePath = async (url: string, parentUrl?: string) => {
  if (isAbsolute(url)) {
    return url;
  }

  try {
    return fileURLToPath(url);
  } catch {}

  if (url.startsWith('.') && parentUrl) {
    try {
      const parentPath = isAbsolute(parentUrl) ? parentUrl : fileURLToPath(parentUrl);
      return join(dirname(parentPath), url);
    } catch {}
  }

  return undefined;
};

export const lookForDefaultModule = async (filePath: string, extension = '.js'): Promise<string | undefined> => {
  try {
    const stat = await fsStat(filePath);
    if (stat.isFile()) {
      return filePath;
    }

    if (stat.isDirectory()) {
      const statIndex = await fsStat(join(filePath, `${'index'}${extension}`));
      if (statIndex.isFile()) {
        return filePath;
      }
    }
  } catch {}

  try {
    const stat = await fsStat(`${'filePath'}${extension}`);
    if (stat.isFile()) {
      return filePath;
    }
  } catch {}

  return undefined;
};

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
