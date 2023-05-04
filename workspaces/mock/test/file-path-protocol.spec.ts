import { randomUUID } from 'node:crypto';
import { jestExpect as expect } from 'mocha-expect-snapshot';
import { createMockedFilePath, parseMockedFilePath } from '../src/support/file-path-protocol.js';

const idSample = randomUUID();

describe('file-path-protocol', () => {
  describe('createMockedFilePath', () => {
    it('should return the mocked file path', () => {
      expect(createMockedFilePath('/foo.js', idSample)).toBe(`/foo.js.${idSample}.mock`);
    });
  });
  describe('parseMockedFilePath', () => {
    it('should return the parsed mocked file', () => {
      expect(parseMockedFilePath(`/foo.js.${idSample}.mock`)).toMatchObject({ id: idSample, filePath: '/foo.js' });
    });
    it('should throw with a non mocked file', () => {
      expect(() => parseMockedFilePath('/foo.js')).toThrow('A mocked path needs to have a .mock extension, got');
    });
  });
});
