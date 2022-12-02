# @node-loaders/esbuild

Loader that mocks imported modules.

## Usage

To configure node and utilites, see [usage](../../README.md)

```js
import { importMocked } from '@node-loaders/mock';

const mockedModule = await importMocked('./module.js', { default: spy(), join: spy() });

mockedModule.default();
mockedModule.join();
```

For better interoperability make sure to use [@node-loaders/auto](../auto/README.md).

## License

MIT
