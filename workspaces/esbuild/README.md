# @node-loaders/esbuild

Loader that transpiles typescript modules using esbuild.

## Usage

For configuration tools, refer to [usage](https://github.com/node-loaders/loaders#usage)

When using in combination with others @node-loaders modules make sure to use [@node-loaders/auto](https://github.com/node-loaders/loaders/tree/main/workspaces/auto#node-loadersauto) for better interoperability.

### Node 14

For Node 14 compatibility use the node14 exported path `@node-loaders/esbuild/node14`.

See [Node 14](https://github.com/node-loaders/loaders#node_14)

### Directory and extension-less imports

ESM is strict on requiring extension.
If there is a need to allow directory and extension-less imports use the `compat` exports.
`@node-loaders/esbuild/compat` and `@node-loaders/esbuild/compat-node14`

## License

MIT
