import { existsSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

import { jestExpect as expect } from 'mocha-expect-snapshot';
import { LoaderCache } from '../src/cache.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

describe('cache', () => {
  let cache: LoaderCache;

  beforeEach(() => {
    cache = new LoaderCache('cache-test');
    expect(cache.cacheDir).toBeDefined();
  });

  afterEach(() => {
    cache.cleanup();
  });

  describe('contructor', () => {
    it('should default to node_modules', () => {
      expect(new LoaderCache('cache-test').cacheDir).toMatch(/node_modules/);
    });
    it('should set cache dir inside customDir', () => {
      const cacheDir = join(__dirname, 'fixtures/');
      expect(new LoaderCache('cache-test', cacheDir).cacheDir).toMatch(cacheDir);
    });
    it('should default to tmpDir if no node_modules is found', () => {
      const cwd = process.cwd();
      process.chdir('/');
      expect(new LoaderCache('cache-test').cacheDir).toMatch(tmpdir());
      process.chdir(cwd);
    });
  });

  describe('with undefined cacheDir', () => {
    const undefinedDirCache = new LoaderCache('cache-test-undefined');
    before(() => {
      undefinedDirCache.cacheDir = undefined;
    });
    it('sync methods should return undefined', () => {
      undefinedDirCache.saveSync('foo');
      expect(undefinedDirCache.getSync('foo')).toBeUndefined();
    });
    it('async methods should return undefined', async () => {
      await undefinedDirCache.save('foo');
      await expect(undefinedDirCache.get('foo')).resolves.toBeUndefined();
    });
  });

  describe('cleanup', () => {
    it('should not remove custom dir', () => {
      const cacheDir = join(__dirname, 'fixtures/');
      const cache = new LoaderCache('cache-test', cacheDir);
      cache.cleanup();
      expect(existsSync(cacheDir)).toBe(true);
    });
  });

  describe('getCacheFile', () => {
    it('should return file in the cache dir', () => {
      expect(cache.getCacheFile(cache.cacheDir!, { file: 'foo' })).toMatch(cache.cacheDir!);
    });
    it('should return the cache file', () => {
      expect(cache.getCacheFile(cache.cacheDir!, { file: 'foo' })).toMatch(/foo.cache$/);
    });
    it('should return the cache file with custom extension', () => {
      expect(cache.getCacheFile(cache.cacheDir!, { file: 'foo', extension: 'bar' })).toMatch(/foo.bar$/);
    });
    it('should return the cache file with custom modifier', () => {
      expect(cache.getCacheFile(cache.cacheDir!, { file: 'foo', modifier: 'bar' })).toMatch(/foo-bar.cache$/);
    });
  });

  describe('save', () => {
    it('should not throw on non existing cacheDir', async () => {
      rmSync(cache.cacheDir!, { recursive: true });
      await cache.save('bar');
    });
    it('should save the cache file', async () => {
      const cacheOptions = { file: 'foo' };
      const cacheName = cache.getCacheFile(cache.cacheDir!, cacheOptions);

      await cache.save('foo', cacheOptions);

      expect(existsSync(cacheName)).toBe(true);
    });
    it('should save the cache with calculated file name', async () => {
      const content = 'foo';
      const cacheOptions = { file: cache.createHash(content) };
      const cacheName = cache.getCacheFile(cache.cacheDir!, cacheOptions);

      await cache.save('foo');

      expect(existsSync(cacheName)).toBe(true);
    });
  });

  describe('saveSync', () => {
    it('should not throw on non existing cacheDir', () => {
      rmSync(cache.cacheDir!, { recursive: true });
      cache.saveSync('bar');
    });
    it('should save the cache file', () => {
      const cacheOptions = { file: 'foo' };
      const cacheName = cache.getCacheFile(cache.cacheDir!, cacheOptions);

      cache.saveSync('foo', cacheOptions);

      expect(existsSync(cacheName)).toBe(true);
    });
    it('should save the cache with calculated file name', () => {
      const content = 'foo';
      const cacheOptions = { file: cache.createHash(content) };
      const cacheName = cache.getCacheFile(cache.cacheDir!, cacheOptions);

      cache.saveSync('foo');

      expect(existsSync(cacheName)).toBe(true);
    });
  });

  describe('getCache', () => {
    it('should get return undefined on non existing file', async () => {
      await expect(cache.get('bar')).resolves.toBeUndefined();
    });
    it('should get the cache content', async () => {
      const content = 'foo';
      const cacheOptions = { file: 'bar' };

      await cache.save(content, cacheOptions);

      await expect(cache.get(cacheOptions)).resolves.toBe(content);
    });
    it('should get the cache content with calculated file name', async () => {
      const content = 'foo';

      await cache.save(content);

      await expect(cache.get(content)).resolves.toBe(content);
    });
  });

  describe('getCacheSync', () => {
    it('should get return undefined on non existing file', () => {
      expect(cache.getSync('bar')).toBeUndefined();
    });
    it('should get the cache content', () => {
      const content = 'foo';
      const cacheOptions = { file: 'bar' };

      cache.saveSync(content, cacheOptions);

      expect(cache.getSync(cacheOptions)).toBe(content);
    });
    it('should get the cache content with calculated file name', () => {
      const content = 'foo';

      cache.saveSync(content);

      expect(cache.getSync(content)).toBe(content);
    });
  });
});
