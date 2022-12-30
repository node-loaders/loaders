const { join, resolve } = require('path');
const { fn: jestMock } = require('@node-loaders/test-samples');

resolve.join = join;
resolve.jestMock = jestMock;

try {
  require('./esm.mjs');
} catch (error) {
  resolve.error = error;
}

module.exports = resolve;
