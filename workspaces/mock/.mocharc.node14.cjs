module.exports = {
  extension: ['spec.ts'],
  require: ['mocha-expect-snapshot'],
  loader: ['@node-loaders/esbuild/node14', './dist/node14.js'],
};
