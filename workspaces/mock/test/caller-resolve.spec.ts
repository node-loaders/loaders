import { jestExpect as expect } from 'mocha-expect-snapshot';

import { resolveCallerUrl } from '../src/caller-resolve.js';

// Add intermediate call to mock mock
function wrap(fn) {
  return fn();
}

describe('caller-resolve', () => {
  describe('resolveCallerUrl', () => {
    it('should return current file', () => {
      expect(wrap(resolveCallerUrl).toLowerCase()).toBe(import.meta.url.toLowerCase());
    });
  });
});
