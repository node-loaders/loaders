import { isAbsolute } from 'node:path';
import { pathToFileURL } from 'node:url';
import StackUtils from 'stack-utils';

export const resolveCallerUrl = (): string => {
  const stack = new StackUtils();
  const error = new Error('Get stack');
  const lines = error.stack?.split('\n');
  if (lines && lines.length > 3) {
    const parsed = stack.parseLine(lines[3]);
    if (parsed?.file) {
      if (isAbsolute(parsed.file)) {
        return pathToFileURL(parsed.file).href;
      }

      return parsed.file;
    }
  }

  throw new Error(`Could not find the source`);
};
