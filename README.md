# @node-loaders

@node-loaders provides clean designed loaders with interoperability focus.

## Usage

For better interoperability use the auto detected installed loaders.

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
