# @node-loaders/jest-mock

Integrates [@node-loaders/mock](https://github.com/node-loaders/loaders/tree/main/workspaces/mock#node-loadersmock) with jest-mock using a jest like api.

## Usage

For configuration tools, refer to [usage](https://github.com/node-loaders/loaders#usage)

`@node-loaders/jest-mock` re-exports `@node-loaders/mock` default loader, for non default loader use `@node-loaders/mock` directly.

## Implementing tests

Import a module with mocked dependencies:

```js
import { mock, checkMocks, restoreMocks } from '@node-loaders/jest-mock';

const mockedPath = await mock<typeof import('path')>('path');
const mockedModule = await import('./module.js');

describe(() => {
  after(() => {
    checkMocks(); // Detects for unused mocks to avoid mistakes on import changes.
    restoreMocks(); // Restore jest-mocks to initial state.
  });

  it(async () => {
    mockedModule.run();
    expect(mockedPath.join).toBeCalled();
  });
});
```

### Advanced options

For advanced options use `importMock` instead of `import`.
For more `importMock` information refer to [mock](https://github.com/node-loaders/loaders/tree/main/workspaces/mock#esm).

```js
import { mock, importMock, checkMocks, fn, restoreMocks, maxDepth, ignoreUnused, fullMock } from '@node-loaders/jest-mock';

const mockedPath = await mock<typeof import('path')>('path');
const mockedFunction = fn.mock();
const mockedModule = await importMock('./module.js', {
  [maxDepth]: number,
  [ignoreUnused]: booelan,
  '../a-mocked-module.js': {
    [fullMock]: true,
    func: mockedFunction,
  },
});

describe(() => {
  after(() => {
    checkMocks(); // Detects for unused mocks to avoid mistakes on import changes.
    restoreMocks(); // Restore jest-mocks to initial state.
  });

  it(async () => {
    mockedModule.run();
    expect(mockedPath.join).toBeCalled();
    expect(mockedFunction).toBeCalled();
  });
});
```

## License

MIT
