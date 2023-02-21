const process = require('node:process');

const { emit } = process;

function suppressWarning(...args) {
  const [event, error] = args;
  return event === 'warning' && error.name === 'ExperimentalWarning' && error.message && error.message.includes('Custom ESM Loaders')
    ? false
    : emit.apply(process, args);
}

process.emit = suppressWarning;
