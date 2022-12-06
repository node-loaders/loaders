export type MockModuleData = Record<string, unknown>;

export const mockedOriginProtocol = 'node-loaders-mock-origin:';
export const mockedSpecifierProtocol = 'node-loaders-mock-specifier:';

type Type = typeof mockedOriginProtocol | typeof mockedSpecifierProtocol;

export type MockedIdData = {
  type: Type;
  cacheId: string;
  specifier: string;
};

export type MockedOriginData = MockedIdData & {
  type: typeof mockedOriginProtocol;
  mockOrigin: string;
};

export type MockedSpecifierData = MockedIdData & {
  type: typeof mockedSpecifierProtocol;
  resolvedSpecifier: string;
  depth: number;
};

const mockedTypeSearchParameter = '@node-loaders/mocked-type';
const mockedIdSearchParameter = '@node-loaders/mocked-id';
const mockedSpecifierSearchParameter = '@node-loaders/mocked-specifier';
const mockedDepthSearchParameter = '@node-loaders/mocked-depth';

export const parseProtocol = (url: string): MockedSpecifierData | MockedOriginData | undefined => {
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(url);
  } catch {
    return undefined;
  }

  const type = parsedUrl.searchParams.get(mockedTypeSearchParameter);
  if (!type) {
    return undefined;
  }

  const baseUrl = parsedUrl.href.slice(0, -parsedUrl.search.length);

  const cacheId = parsedUrl.searchParams.get(mockedIdSearchParameter);
  const specifier = parsedUrl.searchParams.get(mockedSpecifierSearchParameter);
  /* c8 ignore next 4 */
  if (!cacheId || !specifier) {
    // Typescript forbids this error
    throw new Error(`Error parsing mocking url ${url}`);
  }

  if (type === mockedOriginProtocol) {
    return { type, cacheId, specifier, mockOrigin: baseUrl };
  }

  if (type === mockedSpecifierProtocol) {
    const depth = Number.parseInt(parsedUrl.searchParams.get(mockedDepthSearchParameter)!, 10);
    return { type, cacheId, specifier, resolvedSpecifier: baseUrl, depth };
  }

  throw new Error(`Bad type: ${type}`);
};

export const buildMockedOriginUrl = (originUrl: string, data: Omit<MockedOriginData, 'type' | 'mockOrigin'>): string => {
  return buildUrl(mockedOriginProtocol, originUrl, data).href;
};

export const buildMockedSpecifierUrl = (resolvedUrl: string, data: Omit<MockedSpecifierData, 'type' | 'resolvedSpecifier'>): string => {
  const url = buildUrl(mockedSpecifierProtocol, resolvedUrl, data);
  url.searchParams.set(mockedDepthSearchParameter, String(data.depth));
  return url.href;
};

export const buildUrl = (type: string, baseUrl: string, data: Omit<MockedIdData, 'type'>): URL => {
  const url = new URL(baseUrl);
  url.searchParams.set(mockedTypeSearchParameter, type);
  url.searchParams.set(mockedIdSearchParameter, data.cacheId);
  url.searchParams.set(mockedSpecifierSearchParameter, data.specifier);
  return url;
};
