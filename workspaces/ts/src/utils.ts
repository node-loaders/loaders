import { dirname, extname } from "node:path";
import { Format } from "@node-loaders/core";
import { readPackageUp } from 'read-pkg-up';

const formatForExtension: Record<string, Format> = {
  '.cjs': 'commonjs',
  '.mjs': 'module',
};

export async function detectFormatForFilePath(filePath: string): Promise<Format> {
  return formatForExtension[extname(filePath)] ?? (await readPackageUp({ cwd: dirname(filePath) }))?.packageJson?.type ?? 'commonjs';
}
