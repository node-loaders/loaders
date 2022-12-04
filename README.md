# @node-loaders

@node-loaders provides clean designed loaders with interoperability focus.

## Usage

For better interoperability use the [@node-loaders/auto](https://github.com/node-loaders/loaders/tree/main/workspaces/auto) that detects installed loaders.

### Node 14

Loaders api at [Node 14](https://nodejs.org/docs/latest-v14.x/api/esm.html#esm_loaders) is quite different from [Node 16](https://nodejs.org/docs/latest-v16.x/api/esm.html#loaders).
For Node 14, use the `@node-loaders/*/node14` exported path.

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
