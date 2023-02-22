[`SIGINT`, `SIGUSR1`, `SIGUSR2`, `SIGTERM`].forEach(signal => {
  process.on(signal, () => {
    console.log(signal);
    process.exit(120);
  });
});

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
await delay(10000); // waiting 10 second.
