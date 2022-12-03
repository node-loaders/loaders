# @node-loaders/core

Types, utilities and base class for custom loaders.

## Usage

Creating a new Loader:

```js
import BaseLoader from '@node-loaders/core';

class CustomLoader extends BaseLoader {
  _handlesEspecifier(specifier, ...) {
    /*
     * Filter calls, non related calls should be forwarded for best interoperatbility.
     *
     * Constructor options provides rules implementation for builtin and package specifiers.
     * To ignore those options override handlesEspecifier instead
     */
    return isTypescriptFile(specifier);
  }

  _resolve(...) {
    // Filtered (by handlesEspecifier) resolve
  }

  _load(...) {
    // Filtered (by handlesEspecifier) load
  }
}

const loader = new CustomLoader({
  forwardBuiltinSpecifiers: true,
  forwardPackageSpecifiers: true,
});

export const resolve = loader.exportResolve();
export const load = loader.exportLoad();
```

## License

MIT
