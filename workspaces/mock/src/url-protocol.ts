export type MockModuleData = Record<string, unknown>;

const mockedProtocol = 'node-loaders-mock:';
const mockedSpecifierProtocol = 'node-loaders-mock-specifier:';

type Protocol = typeof mockedProtocol | typeof mockedSpecifierProtocol;

export type MockData = {
  protocol: Protocol;
  specifier: string;
  cacheId: string;
};

const mockedIdSearchParameter = '@node-loaders/mocked-id';
const mockedSpecifierSearchParameter = '@node-loaders/mocked-specifier';

export const parseProtocol = (url: string): MockData | undefined => {
  try {
    const parsedUrl = new URL(url);
    if ([mockedProtocol, mockedSpecifierProtocol].includes(parsedUrl.protocol)) {
      const cacheId = parsedUrl.searchParams.get(mockedIdSearchParameter);
      const specifier = parsedUrl.searchParams.get(mockedSpecifierSearchParameter);
      if (cacheId && specifier) {
        return { cacheId, specifier, protocol: parsedUrl.protocol as Protocol };
      }
    }
  } catch {}

  return undefined;
};

export const buildUrl = (data: Omit<MockData, 'protocol'>): string => {
  const url = new URL(`${mockedProtocol}//mocked`);
  url.searchParams.set(mockedIdSearchParameter, data.cacheId);
  url.searchParams.set(mockedSpecifierSearchParameter, data.specifier);
  return url.href;
};

export const buildMockedSpecifierUrl = (data: Omit<MockData, 'protocol'>): string => {
  const url = new URL(`${mockedSpecifierProtocol}//mocked`);
  url.searchParams.set(mockedIdSearchParameter, data.cacheId);
  url.searchParams.set(mockedSpecifierSearchParameter, data.specifier);
  return url.href;
};
