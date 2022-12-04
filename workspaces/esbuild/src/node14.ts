import { fileURLToPath } from 'node:url';
import { addNode14Support } from '@node-loaders/core';
import { detectPackageJsonType } from '@node-loaders/resolve';
import EsbuildLoader from './esbuild-loader.js';
import { detectFormatForEsbuildFileExtension, isEsbuildExtensionSupported } from './esbuild-module.js';

export class Node14EsbuildLoader extends addNode14Support(EsbuildLoader) {
  override async _getFormat(url: string): Promise<undefined | { format: string }> {
    if (!isEsbuildExtensionSupported(url)) {
      return undefined;
    }

    const format = detectFormatForEsbuildFileExtension(url) ?? (await detectPackageJsonType(fileURLToPath(url)));
    return { format };
  }
}

const loader = new Node14EsbuildLoader();

export default loader;

export const resolve = loader.exportResolve();
export const load = loader.exportLoad();

// Keep node 14 compatibility
export const getFormat = loader.exportGetFormat();
export const getSource = loader.exportGetSource();
export const transformSource = loader.exportTransformSource();
