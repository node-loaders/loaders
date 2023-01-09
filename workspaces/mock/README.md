# @node-loaders/mock

Loader that mocks imported/required modules.

## Features

- ESM support
- CJS support
- Mixed CJS/ESM support
- Framework agnostic
- Typescript support (using a typescript loader, except CJS)
- Delegates the actual module import to the chain, keeping compatibility with others loaders (like typescript)
- No cache manipulation is necessary, no drawbacks like [why-is-proxyquire-messing-with-my-require-cache](https://github.com/thlorenz/proxyquire#why-is-proxyquire-messing-with-my-require-cache)
- Compatible with Typescript's `esModuleInterop`
- Full or partial mock support
- Unused mock detection
- Configurable mocked module import deep using `maxDepth` (symbol) property. 
- Trivial to use

## Design

Mock uses an unique approach.
Importing using mock will create an alternative version of the module using mocked file names.
ESM supportes url, mock adds necessary metadata to the url search parameters. CJS uses absolute paths, the metadata is stored and passed using a uuid appended to the file path folowing a `.mock` extension.
The mocked files will continue until `maxDepth` is reached (-1 by default, deep import).

Prior art: [proxyquire](https://github.com/thlorenz/proxyquire), [esmock](https://github.com/iambumblehead/esmock).

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
        [maxDepth]: -1, // Mocked a configurable deep
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
