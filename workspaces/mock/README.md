# @node-loaders/esbuild

Loader that mocks imported modules.

## Usage

For configuration tools, refer to [usage](https://github.com/node-loaders/loaders#usage)

Importing a module with mocked dependencies:

```js
import { mock } from '@node-loaders/mock';

const mockedModule = await mock('./module.js', {
  default: spy(),
  join: spy(),
});

mockedModule.default();
mockedModule.join();
```

When using in combination with others @node-loaders modules make sure to use [@node-loaders/auto](https://github.com/node-loaders/loaders/tree/main/workspaces/auto#node-loadersauto) for better interoperability .

### Node 14

For Node 14 compatibility use the node14 exported path `@node-loaders/mock/node14`.

See [Node 14](https://github.com/node-loaders/loaders#node_14)

## License

MIT
