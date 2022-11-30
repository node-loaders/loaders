const isProtocol = (maybeUrl: string, protocol: string): boolean => {
  try {
    const myUrl = new URL(maybeUrl);
    return myUrl.protocol === protocol;
  } catch {
    return false;
  }
};

export { isProtocol };
