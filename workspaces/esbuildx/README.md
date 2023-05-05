# esbuildx

Run typescript scripts using esbuild and `@node-loaders/esbuild`

## Usage

Using cli:

```
esbuildx file.ts
```

Using API (Use cjs for executables, refer to https://github.com/nodejs/modules/issues/152):

```cjs
#!/usr/bin/env node

module.exports = (async () => {
  const { default: esbuildx } = await import('./esbuildx.js');
  await esbuildx({ executable });
})();
```

## License

MIT
