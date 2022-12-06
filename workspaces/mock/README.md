# @node-loaders/esbuild

Loader that mocks imported modules.

## Usage

For configuration tools, refer to [usage](https://github.com/node-loaders/loaders#usage)

Importing a module with mocked dependencies:

```js
import { mock, checkMocks } from '@node-loaders/mock';

describe(() => {
  afterAll(() => {
    checkMocks(); // Detects for unused mocks to avoid mistakes on import changes.
  }),

  it(() => {
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
  }),

  it(() => {
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
  }),

  it(() => {
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

When using in combination with others @node-loaders modules make sure to use [@node-loaders/auto](https://github.com/node-loaders/loaders/tree/main/workspaces/auto#node-loadersauto) for better interoperability .

### Node 14

For Node 14 compatibility use the node14 exported path `@node-loaders/mock/node14`.

See [Node 14](https://github.com/node-loaders/loaders#node_14)

## License

MIT
