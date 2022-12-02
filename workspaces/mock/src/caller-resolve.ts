import { isAbsolute, join } from 'node:path';
import { pathToFileURL } from 'node:url';
import StackUtils from 'stack-utils';

export const resolveCallerUrl = (): string => {
  const stack = new StackUtils();
  const error = new Error('Get stack');
  const lines = error.stack?.split('\n');
  if (lines) {
    while (lines.length > 0 && !lines[0].startsWith('Error: Get stack')) {
      lines.shift();
    }
  }

  if (lines && lines.length > 3) {
    const parsed = stack.parseLine(lines[3]);
    if (parsed?.file) {
      if (isAbsolute(parsed.file)) {
        return pathToFileURL(parsed.file).href;
      }

      try {
        new URL(parsed.file);
        return parsed.file;
      } catch {}

      // ParseLine makes the file relative.
      return pathToFileURL(join(process.cwd(), parsed.file)).href;
    }
  }

  throw new Error(`Could not find the source`);
};
