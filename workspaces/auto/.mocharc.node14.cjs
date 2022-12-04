module.exports = {
  extension: ['spec.ts'],
  loader: ['./dist/node14.js'],
  require: ['mocha-expect-snapshot'],
  spec: ['../esbuild/test/**/*.spec.*', '../mock/test/**/*.spec.*'],
};
