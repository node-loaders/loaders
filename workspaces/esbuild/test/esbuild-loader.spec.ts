import { jestExpect as expect } from 'mocha-expect-snapshot';
import loader from '../dist/index.js';

const actualDefault = await import('./fixtures/imports/index.js');

describe('esbuild-loader', () => {
  it('should import package.json imports', async () => {
    const local = await import('#local');
    expect(local).toBe(actualDefault);
  });
  it('should throw on missing file', async () => {
    await expect(import('./fixtures/imports/non-existing.js')).rejects.toThrow(/^Module not found/);
  });

  describe('when allowDefaults is enabled', () => {
    beforeEach(() => {
      loader.allowDefaults = true;
    });
    afterEach(() => {
      loader.allowDefaults = false;
    });

    it('should import extension less', async () => {
      const local = await import('./fixtures/imports/index');
      expect(local).toBe(actualDefault);
    });
    it('should import directory', async () => {
      const local = await import('./fixtures/imports');
      expect(local).toBe(actualDefault);
    });
  });
});
