# @node-loaders

@node-loaders provides clean designed loaders with interoperability focus.

## Loaders

- [Esbuild](https://github.com/node-loaders/loaders/tree/main/workspaces/esbuild)
- [Mock](https://github.com/node-loaders/loaders/tree/main/workspaces/mock)
- [jest-mock](https://github.com/node-loaders/loaders/tree/main/workspaces/jest-mock)
- [Auto](https://github.com/node-loaders/loaders/tree/main/workspaces/auto)

## Usage

For better interoperability use the [@node-loaders/auto](https://github.com/node-loaders/loaders/tree/main/workspaces/auto) that detects installed loaders.

### Node

#### cli

```shell
node --loader=@node-loaders/auto
```

### Mocha

#### cli

```shell
mocha --loader=@node-loaders/auto
```

#### config file

```json
{
  "loader": ["@node-loaders/auto"]
}
```

## References

Loaders is a experimental [Node feature](https://nodejs.org/api/esm.html#loaders).

[Node loaders team](https://github.com/nodejs/loaders)

## License

MIT
