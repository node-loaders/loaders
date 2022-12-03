/* eslint-disable @typescript-eslint/naming-convention */
import { dirname, extname } from 'node:path';
import { type Format } from '@node-loaders/core';
import { readPackageUp } from 'read-pkg-up';
import { lookForAlternativeFiles } from '@node-loaders/resolve';

const esbuildExtensions = new Set<string>(['.ts', '.cts', '.mts', '.tsx']);
const formatForExtension: Record<string, Format> = {
  '.cts': 'commonjs',
  '.mts': 'module',
};
const replacementsForExtension: Record<string, string[]> = {
  '.js': ['.ts', '.tsx', '.jsx'],
  '.jsx': ['.tsx'],
  '.cjs': ['.cts'],
  '.mjs': ['.mts'],
};

export function detectFormatForEsbuildFileExtension(filePath: string): Format {
  return formatForExtension[extname(filePath)];
}

export async function detectFormatForEsbuildFilePath(filePath: string): Promise<Format> {
  const read = await readPackageUp({ cwd: dirname(filePath) });
  return read!.packageJson!.type ?? 'commonjs';
}

export function isEsbuildExtensionSupported(filePath: string): boolean {
  return esbuildExtensions.has(extname(filePath));
}

export async function lookForEsbuildReplacementFile(filePath: string): Promise<string | undefined> {
  const replacementExtensions = replacementsForExtension[extname(filePath)];
  if (replacementExtensions) {
    const alternativeFiles = await lookForAlternativeFiles(filePath);
    const compatibleFiles = alternativeFiles.filter(file => replacementExtensions.includes(extname(file)));
    return compatibleFiles.length > 0 ? compatibleFiles[0] : undefined;
  }

  return undefined;
}
