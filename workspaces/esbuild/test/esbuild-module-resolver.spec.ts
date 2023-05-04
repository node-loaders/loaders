import { createRequire } from 'node:module';
import { jestExpect as expect } from 'mocha-expect-snapshot';
import { resolvePackage } from '../../test/src/index.js';

const require = createRequire(import.meta.url);

describe('esbuild-module-resolver', () => {
  describe('require', () => {
    it('loads a cts file', () => {
      expect(require(resolvePackage('cts-simple/simple.cjs'))).toEqual('cts-simple');
    });
    it('throw on a missing cts file', () => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return
      expect(() => require(resolvePackage('cts-simple/simple2.cjs'))).toThrow(/^Cannot find module/);
    });
  });
});
