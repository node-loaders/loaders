import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
import process from 'node:process';
import { execa, ExecaError } from 'execa';

const require = createRequire(import.meta.url);

export type EsbuildXOptions = { executable: string; argv?: string[]; nodeArgv?: string[] };

export default async function esbuildx(options?: string | EsbuildXOptions) {
  options = typeof options === 'string' ? { executable: options } : options;
  const { executable, argv = process.argv.slice(2), nodeArgv = [] } = options || {};
  const loaderUrl = pathToFileURL(require.resolve('@node-loaders/esbuild')).toString();
  const spawnArgv = executable ? [executable, ...argv] : argv;

  const child = execa(
    process.execPath,
    ['--loader', loaderUrl, '--require', require.resolve('./suppress-warnings.cjs'), ...nodeArgv, ...spawnArgv],
    {
      stdio: 'inherit',
    },
  );

  [`SIGINT`, `SIGUSR1`, `SIGUSR2`, `SIGTERM`].forEach(eventType => {
    process.on(eventType, signal => child.kill(signal));
  });

  return child.then(
    result => {
      process.exitCode = result.exitCode;
      return result;
    },
    error => {
      process.exitCode = (error as ExecaError).exitCode;
    },
  );
}
