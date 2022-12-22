const { join, resolve } = require('path');
const { fn: jestMock } = require('@node-loaders/test-samples');

resolve.join = join;
resolve.jestMock = jestMock;

module.exports = resolve;
