import { builtinModules } from 'node:module';
import { isProtocol } from './url.js';

const NODE_PROTOCOL = 'node:';

const isBuiltIn = (module: string): boolean => builtinModules.includes(module) || isProtocol(module, NODE_PROTOCOL);

export default isBuiltIn;
