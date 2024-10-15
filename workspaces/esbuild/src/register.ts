import Module from 'node:module';
import EsbuildModuleResolver from './esbuild-module-resolver.js';

new EsbuildModuleResolver().register();
Module.register(import.meta.resolve('./index-strict.js'));
