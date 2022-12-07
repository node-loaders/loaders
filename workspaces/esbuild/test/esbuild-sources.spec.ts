import { pathToFileURL } from 'node:url';
import { jestExpect as expect } from 'mocha-expect-snapshot';
import { resolvePackage } from '../../test/src/index.js';

import { EsbuildSources } from '../src/esbuild-sources.js';

describe('esbuild-sources', () => {
  let esbuildSource: EsbuildSources;
  beforeEach(() => {
    esbuildSource = new EsbuildSources();
  });

  it('should loaded a mts file', async () => {
    const fileUrl = pathToFileURL(resolvePackage('mts-simple/simple.mts')).href;
    await expect(esbuildSource.getSource(fileUrl)).resolves.toBeDefined();
    await expect(esbuildSource.getSource(fileUrl)).resolves.toBeDefined();
  });

  it('should loaded a cts file', () => {
    const fileUrl = pathToFileURL(resolvePackage('cts-simple/simple.cts')).href;
    expect(esbuildSource.getSourceSync(fileUrl)).toBeDefined();
    expect(esbuildSource.getSourceSync(fileUrl)).toBeDefined();
  });
});
