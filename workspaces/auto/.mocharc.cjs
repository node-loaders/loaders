module.exports = {
  extension: ['spec.ts'],
  loader: ['./dist/index.js'],
  spec: ['../esbuild/test/**/*.spec.*', '../mock/test/**/*.spec.*'],
};
