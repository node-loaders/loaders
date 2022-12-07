module.exports = {
  extension: ['spec.ts'],
  loader: ['./dist/index-default.js'],
  require: ['mocha-expect-snapshot'],
  spec: ['../esbuild/test/**/*.spec.*', '../mock/test/**/*.spec.*'],
};
