export const mockExtension = '.mock';

const idSize = 36; // UUID

export const isMockedFilePath = (filePath: string) => filePath.endsWith(mockExtension);

export const createMockedFilePath = (filePath: string, cacheId: string): string => {
  return `${filePath}.${cacheId}.mock`;
};

export const parseMockedFilePath = (filePath: string): { id: string; filePath: string } => {
  if (!isMockedFilePath(filePath)) {
    throw new Error(`A mocked path needs to have a ${mockExtension} extension, got ${filePath}`);
  }

  filePath = filePath.slice(0, -mockExtension.length);
  const id = filePath.slice(-idSize);
  filePath = filePath.slice(0, -(idSize + 1));
  return { id, filePath };
};
