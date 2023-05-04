# @node-loaders/auto

Auto detect @node-loaders installed loaders.

The order of loaders can break some functionalities.
Using this loader makes sure @node-loaders order is optimal.

Example: to mock typescript modules, the mock loader should be called before typescript loader.

## Usage

For configuration tools, refer to [usage](https://github.com/node-loaders/loaders#usage)

### Loaders

- `@node-loaders/auto` use default behavior for [esbuild](https://github.com/node-loaders/loaders/tree/main/workspaces/esbuild#loaders) and [mock](https://github.com/node-loaders/loaders/tree/main/workspaces/mock#loaders) when available.
- `@node-loaders/auto/strict` use strict behavior for [esbuild](https://github.com/node-loaders/loaders/tree/main/workspaces/esbuild#loaders) and default behaviour for [mock](https://github.com/node-loaders/loaders/tree/main/workspaces/mock#loaders) when available.
- `@node-loaders/auto/esm` use esm behavior for [esbuild](https://github.com/node-loaders/loaders/tree/main/workspaces/esbuild#loaders) and [mock](https://github.com/node-loaders/loaders/tree/main/workspaces/mock#loaders) when available.

## License

MIT
