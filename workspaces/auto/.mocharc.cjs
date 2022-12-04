module.exports = {
  extension: ['spec.ts'],
  loader: ['./dist/index.js'],
  require: ['mocha-expect-snapshot'],
  spec: ['../esbuild/test/**/*.spec.*', '../mock/test/**/*.spec.*'],
};
