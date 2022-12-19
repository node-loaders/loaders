/** @type {import('jest').Config} */
const jestConfig = {
  runner: 'jest-light-runner',
  rootDir: '../mock/test',
  transform: {},
  moduleNameMapper: {
    '#mock-exports': '@node-loaders/mock',
  },
};

export default jestConfig;
