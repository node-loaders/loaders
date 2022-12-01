/* eslint-disable @typescript-eslint/naming-convention */
import { dirname, extname } from 'node:path';
import { type Format } from '@node-loaders/core';
import { readPackageUp } from 'read-pkg-up';

const formatForExtension: Record<string, Format> = {
  '.cjs': 'commonjs',
  '.mjs': 'module',
};

export async function detectFormatForFilePath(filePath: string): Promise<Format> {
  // eslint-disable-next-line unicorn/no-await-expression-member
  return formatForExtension[extname(filePath)] ?? (await readPackageUp({ cwd: dirname(filePath) }))?.packageJson?.type ?? 'commonjs';
}
