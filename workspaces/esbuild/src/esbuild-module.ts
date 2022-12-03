/* eslint-disable @typescript-eslint/naming-convention */
import { extname } from 'node:path';
import { type Format } from '@node-loaders/core';
import { resolveAlternativeFile } from '@node-loaders/resolve';

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

export function isEsbuildExtensionSupported(filePath: string): boolean {
  return esbuildExtensions.has(extname(filePath));
}

export async function lookForEsbuildReplacementFile(filePath: string): Promise<string | undefined> {
  const replacementExtensions = replacementsForExtension[extname(filePath)];
  if (replacementExtensions) {
    return resolveAlternativeFile(filePath, replacementExtensions);
  }

  return undefined;
}
