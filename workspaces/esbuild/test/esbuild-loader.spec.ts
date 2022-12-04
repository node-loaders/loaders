import { jestExpect as expect } from 'mocha-expect-snapshot';

import loader from '../src/index.js';
import compat from '../src/compat.js';
import { resolvePackage } from '../../test/src/index.js';

const actualDefault = await import('./fixtures/imports/local/index.js');

describe('esbuild-loader', () => {
  it('should import package.json imports', async () => {
    const local = await import('#local');
    expect(local).toBe(actualDefault);
  });
  it('should throw on missing file', async () => {
    await expect(import('./non-existing.js')).rejects.toThrow(/^Module not found/);
  });

  describe('lookForExistingEsbuildFilePath', () => {
    describe('for enabled allowDefaults', () => {
      it('should find the file without extension', async () => {
        expect(await compat.lookForExistingEsbuildFilePath(resolvePackage('ts-esm-index/index'))).toMatch(/index.ts$/);
      });
      it('should find directory default', async () => {
        expect(await compat.lookForExistingEsbuildFilePath(resolvePackage('ts-esm-index'))).toMatch(/index.ts$/);
      });
    });

    describe('for disabled allowDefaults', () => {
      it('should not find the file without extension', async () => {
        expect(await loader.lookForExistingEsbuildFilePath(resolvePackage('ts-esm-index/index'))).toBeUndefined();
      });
      it('should not find directory default', async () => {
        expect(await loader.lookForExistingEsbuildFilePath(resolvePackage('ts-esm-index'))).toBeUndefined();
      });
    });
  });
});
