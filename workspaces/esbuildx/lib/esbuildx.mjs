import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
import process from 'node:process';
import spawn from 'cross-spawn';

const require = createRequire(import.meta.url);

export default function esbuildx(options) {
  options = typeof options === 'string' ? { executable: options } : options;
  const { executable, argv = process.argv.slice(2), nodeArgv = [] } = options || {};
  const loaderUrl = pathToFileURL(require.resolve('@node-loaders/esbuild')).toString();
  const spawnArgv = executable ? [executable, ...argv] : argv;
  spawn(process.execPath, ['--loader', loaderUrl, '--require', require.resolve('./suppress-warnings.cjs'), ...nodeArgv, ...spawnArgv], {
    stdio: 'inherit',
  });
}
