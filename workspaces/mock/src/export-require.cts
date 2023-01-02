const { mockRequire, createRequireMock } = global['@node-loaders/mock/module-resolver'];

if (!mockRequire) {
  throw new Error(`Mock loader was not loaded correctly`);
}

export { mockRequire, createRequireMock };
