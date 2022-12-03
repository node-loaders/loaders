const createStack = functions => {
  let stacked = functions.pop();
  while (functions.length > 0) {
    const last = functions.pop();
    const temporary = stacked;
    stacked = (arg1, arg2) => last(arg1, arg2, temporary);
  }

  return stacked;
};

export default createStack;
