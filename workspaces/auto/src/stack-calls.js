const createStack = functions => {
  let stacked = functions.pop();
  while (functions.length > 0) {
    const last = functions.pop();
    const tmp = stacked;
    stacked = (arg1, arg2) => last(arg1, arg2, tmp);
  }
  return stacked;
};

export default createStack;
