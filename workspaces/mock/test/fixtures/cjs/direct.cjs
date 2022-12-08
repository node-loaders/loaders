const { join, resolve } = require('path');
const { fn: jestMock } = require('jest-mock');

resolve.join = join;
resolve.jestMock = jestMock;

module.exports = resolve;
