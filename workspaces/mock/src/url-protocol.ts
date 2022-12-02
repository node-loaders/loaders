export type MockModuleData = Record<string, unknown>;

export const mockedOriginProtocol = 'node-loaders-mock-origin:';
export const mockedModuleProtocol = 'node-loaders-mock-module:';
export const mockedSpecifierProtocol = 'node-loaders-mock-specifier:';

type Protocol = typeof mockedOriginProtocol | typeof mockedSpecifierProtocol | typeof mockedModuleProtocol;

export type MockedIdData = {
  protocol: Protocol;
  cacheId: string;
  specifier: string;
};

export type MockedOriginData = MockedIdData & {
  protocol: typeof mockedOriginProtocol;
  mockOrigin: string;
};

export type MockedModuleData = MockedIdData & {
  protocol: typeof mockedModuleProtocol;
  resolvedParent: string;
};

export type MockedSpecifierData = MockedIdData & {
  protocol: typeof mockedSpecifierProtocol;
  resolvedSpecifier: string;
};

const mockedIdSearchParameter = '@node-loaders/mocked-id';
const mockedSpecifierSearchParameter = '@node-loaders/mocked-specifier';
const mockedResolvedSpecifierSearchParameter = '@node-loaders/mocked-resolved-specifier';
const mockedOriginSearchParameter = '@node-loaders/mocked-origin';
const mockedResovedParentSearchParameter = '@node-loaders/mocked-resolved-parent';

export const parseProtocol = (url: string): MockedSpecifierData | MockedOriginData | MockedModuleData | undefined => {
  try {
    const parsedUrl = new URL(url);
    const { protocol } = parsedUrl;
    if ([mockedOriginProtocol, mockedSpecifierProtocol].includes(protocol)) {
      const cacheId = parsedUrl.searchParams.get(mockedIdSearchParameter);
      const specifier = parsedUrl.searchParams.get(mockedSpecifierSearchParameter);
      if (!cacheId || !specifier) {
        throw new Error(`Error parsing mocking url ${url}`);
      }

      if (protocol === mockedOriginProtocol) {
        const mockOrigin = parsedUrl.searchParams.get(mockedOriginSearchParameter)!;
        return { protocol, cacheId, specifier, mockOrigin };
      }

      if (protocol === mockedSpecifierProtocol) {
        const resolvedSpecifier = parsedUrl.searchParams.get(mockedResolvedSpecifierSearchParameter)!;
        return { protocol, cacheId, specifier, resolvedSpecifier };
      }

      if (protocol === mockedModuleProtocol) {
        const resolvedParent = parsedUrl.searchParams.get(mockedResovedParentSearchParameter)!;
        return { protocol, cacheId, specifier, resolvedParent };
      }
    }
  } catch {}

  return undefined;
};

export const buildMockedOriginUrl = (data: Omit<MockedOriginData, 'protocol'>): string => {
  const url = buildUrl(mockedOriginProtocol, data);
  if (data.mockOrigin) {
    url.searchParams.set(mockedOriginSearchParameter, data.mockOrigin);
  }

  return url.href;
};

export const buildMockedModuleUrl = (data: Omit<MockedModuleData, 'protocol'>): string => {
  const url = buildUrl(mockedOriginProtocol, data);
  if (data.resolvedParent) {
    url.searchParams.set(mockedResovedParentSearchParameter, data.resolvedParent);
  }

  return url.href;
};

export const buildMockedSpecifierUrl = (data: Omit<MockedSpecifierData, 'protocol'>): string => {
  const url = buildUrl(mockedSpecifierProtocol, data);
  if (data.resolvedSpecifier) {
    url.searchParams.set(mockedResolvedSpecifierSearchParameter, data.resolvedSpecifier);
  }

  return url.href;
};

const buildUrl = (protocol: string, data: Omit<MockedIdData, 'protocol'>): URL => {
  const url = new URL(`${protocol}//mocked`);
  url.searchParams.set(mockedIdSearchParameter, data.cacheId);
  url.searchParams.set(mockedSpecifierSearchParameter, data.specifier);
  return url;
};
