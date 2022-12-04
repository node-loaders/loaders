import { isAbsolute, join } from 'node:path';
import process from 'node:process';
import { pathToFileURL } from 'node:url';
import { inspect } from 'node:util';
import StackUtils from 'stack-utils';

const stackLineToGet = 3;

export const resolveCallerUrl = (): string => {
  const stackUtils = new StackUtils({ cwd: 'please I want absolutes paths' });
  const error = new Error('Get stack');

  const stack = error.stack!.split('\n');
  while (!/^\s*at /.test(stack[0])) {
    stack.shift();
  }

  const lines = stackUtils.clean(stack).split('\n');
  if (lines && lines.length >= stackLineToGet) {
    const parsed = stackUtils.parseLine(lines[stackLineToGet - 1]);
    if (parsed?.file) {
      if (isAbsolute(parsed.file)) {
        return pathToFileURL(parsed.file).href;
      }

      // Stack trace usually are paths, url may happen specially on windows
      /* c8 ignore next 5 */
      try {
        // eslint-disable-next-line no-new
        new URL(parsed.file);
        return parsed.file;
      } catch {}
    }
  }

  // Not supposed to happen
  /* c8 ignore next */
  throw new Error(`Could not find the source at ${inspect(lines)}`);
};
