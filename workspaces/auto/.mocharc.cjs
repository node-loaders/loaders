module.exports = {
  extension: ['spec.ts'],
  loader: ['./dist/node14.js'],
  spec: ['../esbuild/test/**/*.spec.*', '../mock/test/**/*.spec.*'],
};
