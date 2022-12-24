import { type MockedIdData } from './types.js';

const mockedIdSearchParameter = '@node-loaders/mocked-id';
const mockedSpecifierSearchParameter = '@node-loaders/mocked-specifier';
const mockedDepthSearchParameter = '@node-loaders/mocked-depth';
const mockedActualSearchParameter = '@node-loaders/mocked-actual';
const requiredParameters = [mockedSpecifierSearchParameter, mockedDepthSearchParameter];

export const parseProtocol = (url: string): MockedIdData | undefined => {
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(url);
  } catch {
    return undefined;
  }

  const cacheId = parsedUrl.searchParams.get(mockedIdSearchParameter)!;
  if (!cacheId) {
    // Not a cache url
    return undefined;
  }

  const missing = requiredParameters.find(searchParamater => !parsedUrl.searchParams.has(searchParamater));
  if (missing) {
    throw new Error(`Error parsing mocking url ${url}, ${missing} is required `);
  }

  const resolvedSpecifier = parsedUrl.href.slice(0, -parsedUrl.search.length);
  const specifier = parsedUrl.searchParams.get(mockedSpecifierSearchParameter)!;
  const depth = Number.parseInt(parsedUrl.searchParams.get(mockedDepthSearchParameter)!, 10);
  const actual = parsedUrl.searchParams.get(mockedActualSearchParameter) === 'true';

  return { cacheId, specifier, resolvedSpecifier, depth, actual };
};

export const buildMockUrl = (data: Omit<MockedIdData, 'depth'> & { depth?: number }): string => {
  const url = new URL(data.resolvedSpecifier);
  url.searchParams.set(mockedDepthSearchParameter, String(data.depth ?? 1));
  url.searchParams.set(mockedIdSearchParameter, data.cacheId);
  url.searchParams.set(mockedSpecifierSearchParameter, data.specifier);
  if (data.actual) {
    url.searchParams.set(mockedActualSearchParameter, String(data.actual));
  }

  return url.toString();
};
