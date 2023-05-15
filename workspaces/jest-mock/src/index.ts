import { resolveCallerUrl, internalMockModule, fullMock } from '@node-loaders/mock';
import { ModuleMocker, type Mocked } from 'jest-mock';

export {
  type MockedModule,
  checkMock,
  checkMocks,
  removeMocks,
  importMock,
  emptyMock,
  fullMock,
  ignoreUnused,
  maxDepth,
  globalPreload,
  load,
  resolve,
} from '@node-loaders/mock';

const moduleMocker = new ModuleMocker(global);

export const resetAllMocks = moduleMocker.resetAllMocks.bind(moduleMocker);

export const fn = moduleMocker.fn.bind(moduleMocker);

export const spyOn = moduleMocker.spyOn.bind(moduleMocker);

export const restoreAllMocks = moduleMocker.restoreAllMocks.bind(moduleMocker);

export const clearAllMocks = moduleMocker.clearAllMocks.bind(moduleMocker);

export const isMockFunction = moduleMocker.isMockFunction.bind(moduleMocker);

/**
 * Mock a resolved specifier
 * @param specifier
 * @returns
 */
export async function mock<MockedType = any>(specifier: string): Promise<Mocked<MockedType>> {
  let mockReturn: Mocked<MockedType> | undefined;
  await internalMockModule<() => Mocked<MockedType>>(resolveCallerUrl(), specifier, (actual: MockedType) => {
    const metadata = moduleMocker.getMetadata<MockedType>(actual)!;
    mockReturn = moduleMocker.generateFromMetadata(metadata);

    const callback = (_actual, options: any) => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return
      return options?.type === 'cjs' ? (mockReturn as any).default : mockReturn!;
    };

    return callback;
  });

  return mockReturn!;
}
