# @node-loaders/esbuild

Loader that mocks imported modules.

## Usage

For configuration tools, refer to [usage](https://github.com/node-loaders/loaders#usage)

Importing a module with mocked dependencies:

```js
import { importMocked } from '@node-loaders/mock';

const mockedModule = await importMocked('./module.js', { default: spy(), join: spy() });

mockedModule.default();
mockedModule.join();
```

When using in combination with others @node-loaders modules make sure to use [@node-loaders/auto](https://github.com/node-loaders/loaders/tree/main/workspaces/auto#node-loadersauto) for better interoperability .

## License

MIT
