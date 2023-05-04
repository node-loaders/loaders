# @node-loaders/esbuild

Loader that transpiles typescript modules using esbuild.

## Usage

For configuration tools, refer to [usage](https://github.com/node-loaders/loaders#usage)

When using in combination with others @node-loaders modules make sure to use [@node-loaders/auto](https://github.com/node-loaders/loaders/tree/main/workspaces/auto#node-loadersauto) for better interoperability.

### Loaders

- `@node-loaders/esbuild` for esm with loose extension support.
- `@node-loaders/esbuild/strict` for esm with strict extension imports with loose require support.
- `@node-loaders/esbuild/esm` for esm with strict extension imports without require support.

## ESM/strict mode

Native ECMAScript support requires imports with extensions, while commonjs files allows directory imports and extensionless files.

To match this behaviour, use:

- `@node-loaders/esbuild/strict` for esm with strict extension imports with loose require support.
- `@node-loaders/esbuild/esm` for esm with strict extension imports without require support.

### Directory and extension-less imports

ESM is strict on requiring extension.
If there is a need to allow directory and extension-less imports use the `compat` exports.
`@node-loaders/esbuild/compat`

## License

MIT
