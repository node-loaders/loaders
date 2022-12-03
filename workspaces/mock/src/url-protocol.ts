export type MockModuleData = Record<string, unknown>;

export const mockedOriginProtocol = 'node-loaders-mock-origin:';
export const mockedModuleProtocol = 'node-loaders-mock-module:';
export const mockedSpecifierProtocol = 'node-loaders-mock-specifier:';

type Type = typeof mockedOriginProtocol | typeof mockedSpecifierProtocol | typeof mockedModuleProtocol;

export type MockedIdData = {
  type: Type;
  cacheId: string;
  specifier: string;
  mockOrigin: string;
};

export type MockedOriginData = MockedIdData & {
  type: typeof mockedOriginProtocol;
};

export type MockedModuleData = MockedIdData & {
  type: typeof mockedModuleProtocol;
  resolvedParent: string;
};

export type MockedSpecifierData = MockedIdData & {
  type: typeof mockedSpecifierProtocol;
  resolvedSpecifier: string;
};

const mockedTypeSearchParameter = '@node-loaders/mocked-type';
const mockedIdSearchParameter = '@node-loaders/mocked-id';
const mockedSpecifierSearchParameter = '@node-loaders/mocked-specifier';
const mockedResolvedSpecifierSearchParameter = '@node-loaders/mocked-resolved-specifier';
const mockedOriginSearchParameter = '@node-loaders/mocked-origin';
const mockedResovedParentSearchParameter = '@node-loaders/mocked-resolved-parent';

export const parseProtocol = (url: string): MockedSpecifierData | MockedOriginData | MockedModuleData | undefined => {
  try {
    const parsedUrl = new URL(url);
    const type = parsedUrl.searchParams.get(mockedTypeSearchParameter);
    if (type) {
      const cacheId = parsedUrl.searchParams.get(mockedIdSearchParameter);
      const specifier = parsedUrl.searchParams.get(mockedSpecifierSearchParameter);
      const mockOrigin = parsedUrl.href.slice(0, -parsedUrl.search.length);
      if (!cacheId || !specifier) {
        throw new Error(`Error parsing mocking url ${url}`);
      }

      if (type === mockedOriginProtocol) {
        return { type, cacheId, specifier, mockOrigin };
      }

      if (type === mockedSpecifierProtocol) {
        const resolvedSpecifier = parsedUrl.searchParams.get(mockedResolvedSpecifierSearchParameter)!;
        return { type, cacheId, specifier, resolvedSpecifier, mockOrigin };
      }

      if (type === mockedModuleProtocol) {
        const resolvedParent = parsedUrl.searchParams.get(mockedResovedParentSearchParameter)!;
        return { type, cacheId, specifier, resolvedParent, mockOrigin };
      }
    }
  } catch {}

  return undefined;
};

export const buildMockedOriginUrl = (data: Omit<MockedOriginData, 'type'>): string => {
  const url = buildUrl(mockedOriginProtocol, data);
  if (data.mockOrigin) {
    url.searchParams.set(mockedOriginSearchParameter, data.mockOrigin);
  }

  return url.href;
};

export const buildMockedModuleUrl = (data: Omit<MockedModuleData, 'type'>): string => {
  const url = buildUrl(mockedOriginProtocol, data);
  if (data.resolvedParent) {
    url.searchParams.set(mockedResovedParentSearchParameter, data.resolvedParent);
  }

  return url.href;
};

export const buildMockedSpecifierUrl = (data: Omit<MockedSpecifierData, 'type'>): string => {
  const url = buildUrl(mockedSpecifierProtocol, data);
  if (data.resolvedSpecifier) {
    url.searchParams.set(mockedResolvedSpecifierSearchParameter, data.resolvedSpecifier);
  }

  return url.href;
};

const buildUrl = (type: string, data: Omit<MockedIdData, 'type'>): URL => {
  const url = new URL(data.mockOrigin);
  url.searchParams.set(mockedTypeSearchParameter, type);
  url.searchParams.set(mockedIdSearchParameter, data.cacheId);
  url.searchParams.set(mockedSpecifierSearchParameter, data.specifier);
  return url;
};
