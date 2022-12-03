import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { jestExpect as expect } from 'mocha-expect-snapshot';

import loader from '../src/index.js';
import compat from '../src/compat.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const actualDefault = await import('./fixtures/imports/default-fallback/index.js');

describe('esbuild-loader', () => {
  it('should import package.json imports', async () => {
    const local = await import('#local');
    expect(local).toBe(actualDefault);
  });
  it('should throw on missing file', async () => {
    await expect(import('./fixtures/imports/default-fallback/non-existing.js')).rejects.toThrow(/^Module not found/);
  });

  describe('lookForExistingEsbuildFilePath', () => {
    describe('for enabled allowDefaults', () => {
      it('should find the file without extension', async () => {
        expect(await compat.lookForExistingEsbuildFilePath(resolve(__dirname, './fixtures/imports/default-fallback/index'))).toMatch(
          /index.ts$/,
        );
      });
      it('should find directory default', async () => {
        expect(await compat.lookForExistingEsbuildFilePath(resolve(__dirname, './fixtures/imports/default-fallback'))).toMatch(/index.ts$/);
      });
    });

    describe('for disabled allowDefaults', () => {
      it('should not find the file without extension', async () => {
        expect(
          await loader.lookForExistingEsbuildFilePath(resolve(__dirname, './fixtures/imports/default-fallback/index')),
        ).toBeUndefined();
      });
      it('should not find directory default', async () => {
        expect(await loader.lookForExistingEsbuildFilePath(resolve(__dirname, './fixtures/imports/default-fallback'))).toBeUndefined();
      });
    });
  });
});
