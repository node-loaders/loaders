const { fn: jestMockDirect } = require('@node-loaders/test-samples');

module.exports = require('./direct.cjs');
module.exports.jestMockDirect = jestMockDirect;
