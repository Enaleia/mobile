import { getEnvironment } from './environment';

// Type-safe environment variables
type EnvVars = {
  // API URLs
  EXPO_PUBLIC_API_URL: string;
  EXPO_PUBLIC_FUNDING_URL: string;
  
  // Network Configuration
  EXPO_PUBLIC_NETWORK_PROVIDER: string;
  EXPO_PUBLIC_NETWORK_SCAN: string;
  
  // EAS Configuration
  EXPO_PUBLIC_EAS_SCHEMA_UID: string;
  
  // Cache Configuration
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

// Try to import local secrets, fallback to empty object if file doesn't exist
let localSecrets: Partial<EnvVars> = {};
try {
  // Only try to load local secrets in development
  if (__DEV__) {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const local = require('../local.env');
    localSecrets = local.LOCAL_SECRETS;
  }
} catch (error) {
  console.debug('[ENV] No local.env.ts found, using process.env');
}

/**
 * Get an environment variable, with local development fallback
 */
export function getEnvVar<K extends keyof EnvVars>(key: K): EnvVars[K] | undefined {
  // Debug information
  console.log('[ENV] Getting environment variable:', {
    key,
    isDev: __DEV__,
    hasProcessEnv: !!process.env[key],
    hasLocalSecret: !!localSecrets[key]
  });

  // In production, only use process.env
  if (!__DEV__) {
    const value = process.env[key] as EnvVars[K];
    console.log('[ENV] Production value:', { key, value });
    return value;
  }

  // In development, try process.env first
  const processEnvValue = process.env[key] as EnvVars[K];
  if (processEnvValue) {
    console.log('[ENV] Using process.env value:', { key, value: processEnvValue });
    return processEnvValue;
  }

  // Then try local secrets in development
  const localValue = localSecrets[key];
  if (localValue) {
    console.log('[ENV] Using local secret value:', { key, value: localValue });
    return localValue;
  }

  console.log('[ENV] No value found for:', { key });
  return undefined;
}

/**
 * Get network configuration based on current environment
 */
export function getNetworkConfig() {
  const providerUrl = getEnvVar('EXPO_PUBLIC_NETWORK_PROVIDER');
  const scanUrl = getEnvVar('EXPO_PUBLIC_NETWORK_SCAN');
  
  if (!providerUrl || !scanUrl) {
    console.error('[ENV] Network configuration not found:');
    console.error('- NETWORK_PROVIDER:', !!providerUrl);
    console.error('- NETWORK_SCAN:', !!scanUrl);
    throw new Error('Network configuration requires valid provider and scan URLs. Please ensure environment variables are properly set.');
  }
  
  return { providerUrl, scanUrl };
}

/**
 * Get EAS Schema UID based on current environment
 */
export function getEASSchemaUID(): string {
  const schemaUid = getEnvVar('EXPO_PUBLIC_EAS_SCHEMA_UID');
  
  if (!schemaUid) {
    console.error('[ENV] EAS Schema UID configuration error:', {
      hasSchemaUid: !!schemaUid,
      allEnvVars: Object.keys(process.env).filter(key => key.includes('EAS_SCHEMA'))
    });
    throw new Error('EAS Schema UID not found. Please ensure environment variables are properly set.');
  }
  
  return schemaUid;
}

/**
 * Get API URL
 */
export function getAPIUrl(): string {
  const apiUrl = getEnvVar('EXPO_PUBLIC_API_URL');
  if (!apiUrl) {
    throw new Error('API URL not configured');
  }
  return apiUrl;
}

/**
 * Get funding URL
 */
export function getFundingUrl(): string {
  const fundingUrl = getEnvVar('EXPO_PUBLIC_FUNDING_URL');
  if (!fundingUrl) {
    throw new Error('Funding URL not configured');
  }
  return fundingUrl;
}

/**
 * Get cache key for a specific queue
 */
export function getQueueCacheKey(queueType: string): string {
  const key = getEnvVar(`EXPO_PUBLIC_${queueType.toUpperCase()}_QUEUE_CACHE_KEY` as keyof EnvVars);
  if (!key) {
    throw new Error(`Cache key not found for queue type: ${queueType}`);
  }
  return key;
} 