# esbuildx

Run typescript scripts using esbuild and `@node-loaders/esbuild`

## Usage

Using cli:

```
esbuildx file.ts
```

Using API:

```js
import { createRequire } from 'module';
import esbuildx from 'esbuildx';

const require = createRequire(import.meta.url);

esbuildx(require.resolve('./bin.js'));
```

## License

MIT
