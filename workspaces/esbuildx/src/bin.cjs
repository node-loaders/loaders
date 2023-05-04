#!/usr/bin/env node
// eslint-disable-next-line unicorn/prefer-top-level-await
module.exports = (async () => {
  const { default: esbuildx } = await import('./esbuildx.mjs');
  await esbuildx();
})();
