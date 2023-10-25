import Module from 'node:module';
import { pathToFileURL } from 'node:url';
import process from 'node:process';
import { execa, type ExecaError } from 'execa';

const require = Module.createRequire(import.meta.url);

// eslint-disable-next-line @typescript-eslint/naming-convention
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
  const {
    executable,
    loaderUrl = pathToFileURL(require.resolve('@node-loaders/esbuild')).toString(),
    argv,
    nodeArgv = [],
    nodeArgs = '',
    additionalArgv = [],
  } = esbuildxoptions ?? {};

  // Use dynamic register if available and there is no additional parameters.
  if ((Module as any).register && executable && !argv && nodeArgv.length === 0 && !nodeArgs && additionalArgv.length === 0) {
    (Module as any).register(loaderUrl);
    await import(executable);
    return;
  }

  const argv2 = argv ?? process.argv.slice(2);
  const spawnArgv = executable ? [executable, ...argv2, ...additionalArgv] : [...argv2, ...additionalArgv];
  let suppressWarnings = require.resolve('./suppress-warnings.cjs');
  if (process.platform === 'win32') {
    suppressWarnings = suppressWarnings.replaceAll('\\', '\\\\');
  }
  const nodeOptions = [`--loader="${loaderUrl}" --require="${suppressWarnings}"`, process.env.NODE_OPTIONS, nodeArgs]
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
    error => {
      process.exitCode = (error as ExecaError).exitCode;
      return error;
    },
  );
}
