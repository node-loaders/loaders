export type MockModuleData = Record<string, unknown>;

const mockedProtocol = 'node-loaders-mock:';
const mockedSpecifierProtocol = 'node-loaders-mock-specifier:';

type Protocol = typeof mockedProtocol | typeof mockedSpecifierProtocol;

export type MockData = {
  protocol: Protocol;
  specifier: string;
  cacheId: string;
  resolvedSpecifier: string;
  parentSpecifier: string;
};

const mockedIdSearchParameter = '@node-loaders/mocked-id';
const mockedSpecifierSearchParameter = '@node-loaders/mocked-specifier';
const mockedResolvedSpecifierSearchParameter = '@node-loaders/mocked-resolved-specifier';
const mockedParentSearchParameter = '@node-loaders/mocked-parent';

export const parseProtocol = (url: string): MockData | undefined => {
  try {
    const parsedUrl = new URL(url);
    if ([mockedProtocol, mockedSpecifierProtocol].includes(parsedUrl.protocol)) {
      const cacheId = parsedUrl.searchParams.get(mockedIdSearchParameter);
      const specifier = parsedUrl.searchParams.get(mockedSpecifierSearchParameter);
      const parentSpecifier = parsedUrl.searchParams.get(mockedSpecifierSearchParameter);
      const resolvedSpecifier = parsedUrl.searchParams.get(mockedResolvedSpecifierSearchParameter);
      if (cacheId && specifier && parentSpecifier && resolvedSpecifier) {
        return { cacheId, specifier, resolvedSpecifier, parentSpecifier, protocol: parsedUrl.protocol as Protocol };
      }
    }
  } catch {}

  return undefined;
};

export const buildUrl = (data: Omit<MockData, 'protocol'>): string => {
  return buildUrlWithProtocol(mockedSpecifierProtocol, data);
};

export const buildMockedSpecifierUrl = (data: Omit<MockData, 'protocol'>): string => {
  return buildUrlWithProtocol(mockedSpecifierProtocol, data);
};

const buildUrlWithProtocol = (protocol: string, data: Omit<MockData, 'protocol'>): string => {
  const url = new URL(`${protocol}//mocked`);
  url.searchParams.set(mockedIdSearchParameter, data.cacheId);
  url.searchParams.set(mockedSpecifierSearchParameter, data.specifier);
  url.searchParams.set(mockedParentSearchParameter, data.parentSpecifier);
  url.searchParams.set(mockedResolvedSpecifierSearchParameter, data.resolvedSpecifier);
  return url.href;
};
