import { jestExpect as expect } from 'mocha-expect-snapshot';

import { resolveCallerUrl } from '../src/caller-resolve.js';

// Add intermediate call to mock importMocked
function resolveCallerUrlWrapper() {
  return resolveCallerUrl();
}

describe('caller-resolve', () => {
  describe('resolveCallerUrl', () => {
    it('should return current file', () => {
      expect(resolveCallerUrlWrapper()).toBe(import.meta.url);
    });
  });
});
