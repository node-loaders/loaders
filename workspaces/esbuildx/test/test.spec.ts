import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execa, type ExecaError } from 'execa';
import { jestExpect as expect } from 'mocha-expect-snapshot';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const binFile = join(__dirname, '../dist/bin.mjs');

describe('esbuildx', () => {
  it('should execute cts file', async () => {
    const result = await execa(binFile, [join(__dirname, 'fixtures/cts.cts')]);
    expect(result.stdout).toBe('cts file');
  });
  it('should execute mts file', async () => {
    const result = await execa(binFile, [join(__dirname, 'fixtures/mts.mts')]);
    expect(result.stdout).toBe('mts file');
  });
  it('should execute ts file', async () => {
    const result = await execa(binFile, [join(__dirname, 'fixtures/ts.ts')]);
    expect(result.stdout).toBe('ts file');
  });
  it('should pass exitCode through', async () => {
    try {
      await execa(binFile, [join(__dirname, 'fixtures/exitcode.ts')]);
    } catch (error: unknown) {
      expect((error as ExecaError).exitCode).toBe(120);
      return;
    }

    throw new Error('Should not happen');
  });
  for (const signal of [`SIGINT`, `SIGUSR1`, `SIGUSR2`, `SIGTERM`]) {
    it(`should forward ${signal} signal to child`, async () => {
      try {
        const child = execa(binFile, [join(__dirname, 'fixtures/wait.ts')], { stdin: 'inherit' });
        setTimeout(() => {
          child.kill(signal);
        }, 500);
        await child;
      } catch (error: unknown) {
        expect((error as ExecaError).stdout).toBe(signal);
        return;
      }

      throw new Error('Should not happen');
    });
  }
});
