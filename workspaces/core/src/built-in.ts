import { builtinModules } from 'node:module';
import { isProtocol } from './url.js';

const nodeProtocol = 'node:';

const isBuiltIn = (module: string): boolean => builtinModules.includes(module) || isProtocol(module, nodeProtocol);

export default isBuiltIn;
