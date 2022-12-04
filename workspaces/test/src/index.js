import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export function resolveResource(...relativePath) {
  return resolve(__dirname, '..', 'resources', ...relativePath);
}

export function resolvePackage(...relativePath) {
  return resolveResource('packages', ...relativePath);
}

export function resolveNonExisting(...relativePath) {
  return resolveResource('non-existing', ...relativePath);
}
