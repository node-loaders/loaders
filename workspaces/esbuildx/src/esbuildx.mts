import Module from 'node:module';
import process from 'node:process';
import { execa, type ExecaError } from 'execa';

const require = Module.createRequire(import.meta.url);

export type EsbuildXOptions = {
  executable?: string;
  loaderUrl?: string;
  argv?: string[];
  nodeArgv?: string[];
  nodeArgs?: string;
  additionalArgv?: string[];
};

export default async function esbuildx(options?: string | EsbuildXOptions) {
  const esbuildxoptions = typeof options === 'string' ? { executable: options } : options;
  const { executable, loaderUrl, argv, nodeArgv = [], nodeArgs: nodeArguments = '', additionalArgv = [] } = esbuildxoptions ?? {};

  // Use dynamic register if available and there is no additional parameters.
  if (executable && !argv && nodeArgv.length === 0 && !nodeArguments && additionalArgv.length === 0) {
    if (loaderUrl) {
      Module.register(loaderUrl);
    } else {
      await import('@node-loaders/esbuild/register');
    }

    await import(executable);
    return;
  }

  const argv2 = argv ?? process.argv.slice(2);
  const spawnArgv: string[] = executable ? [executable, ...argv2, ...additionalArgv] : [...argv2, ...additionalArgv];
  const nodeOptions = [`--loader="${loaderUrl ?? import.meta.resolve('@node-loaders/esbuild')}"`, process.env.NODE_OPTIONS, nodeArguments]
    .filter(Boolean)
    .join(' ');

  const child = execa(process.execPath, [...nodeArgv, ...spawnArgv], {
    stdio: 'inherit',
    env: {
      ...process.env,
      NODE_OPTIONS: nodeOptions,
    },
  });

  for (const eventType of [`SIGINT`, `SIGUSR1`, `SIGUSR2`, `SIGTERM`]) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    process.on(eventType, signal => child.kill(signal));
  }

  return child.then(
    result => {
      process.exitCode = result.exitCode;
      return result;
    },
    (error: Error) => {
      process.exitCode = (error as ExecaError).exitCode;
      return error;
    },
  );
}
