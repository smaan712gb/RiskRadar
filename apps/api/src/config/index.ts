import { validateEnv, type Env } from './env.js';

let _config: Env | null = null;

export function getConfig(): Env {
  if (!_config) {
    _config = validateEnv();
    Object.freeze(_config);
  }
  return _config;
}
