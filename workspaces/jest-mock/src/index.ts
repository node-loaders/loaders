import { resolveCallerUrl, internalMockModule } from '@node-loaders/mock';
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
  return internalMockModule<Mocked<MockedType>>(resolveCallerUrl(), specifier, (actual: MockedType) => {
    const metadata = moduleMocker.getMetadata<MockedType>(actual)!;
    return moduleMocker.generateFromMetadata(metadata);
  });
}
