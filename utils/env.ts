import { getEnvironment } from "./environment";

type EnvVars = {
  EXPO_PUBLIC_API_URL: string;
  EXPO_PUBLIC_FUNDING_URL: string;
  EXPO_PUBLIC_NETWORK_PROVIDER: string;
  EXPO_PUBLIC_NETWORK_SCAN: string;
  EXPO_PUBLIC_EAS_SCHEMA_UID: string;
  EXPO_PUBLIC_CACHE_KEY: string;
  EXPO_PUBLIC_BATCH_CACHE_KEY: string;
  EXPO_PUBLIC_ACTIVE_QUEUE_CACHE_KEY: string;
  EXPO_PUBLIC_COMPLETED_QUEUE_CACHE_KEY: string;
  EXPO_PUBLIC_INACTIVE_QUEUE_CACHE_KEY: string;
  EXPO_PUBLIC_SORTING_QUEUE_CACHE_KEY: string;
  EXPO_PUBLIC_MANUFACTURING_QUEUE_CACHE_KEY: string;
  EXPO_PUBLIC_WASHING_QUEUE_CACHE_KEY: string;
  EXPO_PUBLIC_SHREDDING_QUEUE_CACHE_KEY: string;
  EXPO_PUBLIC_PELLETIZING_QUEUE_CACHE_KEY: string;
};

/**
 * Get an environment variable
 * @param key The environment variable key
 * @returns The environment variable value
 */
export function getEnvVar<K extends keyof EnvVars>(key: K): EnvVars[K] {
  const value = process.env[key] as EnvVars[K];
  if (!value) {
    throw new Error(`Environment variable ${key} not found`);
  }
  return value;
}

/**
 * Get all environment variables
 * @returns Debug information about environment variables
 */
export function getEnvInfo() {
  return {
    environment: getEnvironment(),
    hasProcessEnv: true,
    envVars: Object.keys(process.env).filter(key => key.startsWith('EXPO_PUBLIC_'))
  };
} 