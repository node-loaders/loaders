/* eslint-disable @typescript-eslint/naming-convention */
import { dirname, extname } from 'node:path';
import { lookForAlternativeFiles, type Format } from '@node-loaders/core';
import { readPackageUp } from 'read-pkg-up';

const esbuildExtensions: string[] = ['.ts', '.cts', '.mts', '.tsx'];
const formatForExtension: Record<string, Format> = {
  '.cts': 'commonjs',
  '.mts': 'module',
};

export function detectFormatForEsbuildFileExtension(filePath: string): Format {
  return formatForExtension[extname(filePath)];
}

export async function detectFormatForEsbuildFilePath(filePath: string): Promise<Format> {
  const read = await readPackageUp({ cwd: dirname(filePath) });
  return read?.packageJson?.type ?? 'commonjs';
}

export function isEsbuildExtensionSupported(filePath: string): boolean {
  return esbuildExtensions.includes(extname(filePath));
}

export async function lookForEsbuildReplacementFile(filePath: string): Promise<string | undefined> {
  const alternativeFiles = await lookForAlternativeFiles(filePath);
  const compatibleFiles = alternativeFiles.filter(file => esbuildExtensions.includes(extname(file)));
  return compatibleFiles.length > 0 ? compatibleFiles[0] : undefined;
}
