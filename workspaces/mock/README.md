# @node-loaders/esbuild

Loader that mocks imported/required modules.

## Usage

For configuration tools, refer to [usage](https://github.com/node-loaders/loaders#usage)

When using in combination with others @node-loaders modules make sure to use [@node-loaders/auto](https://github.com/node-loaders/loaders/tree/main/workspaces/auto#node-loadersauto) for better interoperability .

### Loaders

- `@node-loaders/mock` provides esm(import) and commonjs(require) mocking.
- `@node-loaders/esm` provides esm(import) mocking only.
- `@node-loaders/node14` provides esm(import) and commonjs(require) mocking compatible with Node v14.

### ESM

Importing a module with mocked dependencies:

```js
import { mock, checkMocks } from '@node-loaders/mock';

describe(() => {
  afterAll(() => {
    checkMocks(); // Detects for unused mocks to avoid mistakes on import changes.
  });

  it(async () => {
    const defaultSpy = spy();
    const joinSpy = spy();

    const mockedModule = await mock('./module.js', {
      '../src/path.js': {
        default: defaultSpy,
        join: joinSpy,
      },
    });

    expect(joinSpy).toBeCalled();
    expect(defaultSpy).toBeCalled();
  });
});
```

Full mocks:

```js
import { mock, checkMocks, fullMock } from '@node-loaders/mock';

describe(() => {
  afterAll(() => {
    checkMocks(); // Detects for unused mocks to avoid mistakes on import changes.
  });

  it(async () => {
    const joinSpy = spy();

    const mockedModule = await mock('./module.js', {
      '../src/path.js': {
        [fullMock]: true, // If a name other than 'join' is imported, a 'Module does not provide an export named' is thrown.
        join: joinSpy,
      },
    });
  });
});
```

Mock check:

```js
import { mock, checkMocks, checkMock, ignoreUnused } from '@node-loaders/mock';

describe(() => {
  afterAll(() => {
    checkMocks(); // Detects for unused mocks to avoid mistakes on import changes.
  });

  it(async () => {
    const joinSpy = spy();
    const resolveSpy = spy();

    const mockedModule = await mock('./module.js', {
      '../src/path.js': {
        join: joinSpy,
      },
      'node:path': {
        [ignoreUnused]: true,
        resolve: resolveSpy,
      },
    });

    checkMock(mockedModule); // throws error if '../src/path.js' was not imported but not on 'node:path'
  });
});
```

Max depth:

```js
import { mock, checkMocks, maxDepth } from '@node-loaders/mock';

describe(() => {
  afterAll(() => {
    checkMocks(); // Detects for unused mocks to avoid mistakes on import changes.
  });

  it(async () => {
    const joinSpy = spy();
    const resolveSpy = spy();

    const mockedModule = await mock('./module.js', {
      '../src/path.js': {
        join: joinSpy, // Mocked when imported from './module.js' file only
      },
      'node:path': {
        [maxDepth]: -1, // Mocked in any child of './module.js'
        resolve: resolveSpy,
      },
    });
  });
});
```

### CommonJS

From an esm module:

```js
import { mockRequire, checkMocks } from '@node-loaders/mock';

describe(() => {
  afterAll(() => {
    checkMocks(); // Detects for unused mocks to avoid mistakes on import changes.
  });

  it(() => {
    const defaultSpy = spy();
    const joinSpy = spy();

    const mockedModule = mockRequire('./module.cjs', {
      '../src/path.cjs': {
        default: defaultSpy,
        join: joinSpy,
      },
    });

    expect(joinSpy).toBeCalled();
    expect(defaultSpy).toBeCalled();
  });
});
```

From a cjs module:

```cjs
const { mockRequire } = require('@node-loaders/mock/require');

describe(() => {
  afterAll(() => {
    checkMocks(); // Detects for unused mocks to avoid mistakes on import changes.
  });

  it(() => {
    const defaultSpy = spy();
    const joinSpy = spy();

    const mockedModule = mockRequire('./module.cjs', {
      '../src/path.cjs': {
        default: defaultSpy,
        join: joinSpy,
      },
    });

    expect(joinSpy).toBeCalled();
    expect(defaultSpy).toBeCalled();
  });
});
```

### Node 14

For Node 14 compatibility use the node14 exported path `@node-loaders/mock/node14`.

For more information refer to [Node 14](https://github.com/node-loaders/loaders#node_14)

### Known issues

CommonJS (require) mocking doesn't mock typescript modules.

## License

MIT
