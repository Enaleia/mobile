import { getEnvironment } from "@/utils/environment";

const HEALTH_CHECK_TIMEOUT = 0; // 2 seconds timeout

export async function checkDirectusHealth(): Promise<boolean> {
  const apiUrl = process.env.EXPO_PUBLIC_API_URL;
  if (!apiUrl) {
    console.error('Directus API URL not configured');
    return false;
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), HEALTH_CHECK_TIMEOUT);

    const response = await fetch(`${apiUrl}/server/health`, {
      method: 'GET',
      signal: controller.signal
    });

    clearTimeout(timeoutId);
    return response.status === 200;
  } catch (error) {
    console.error('Directus health check failed:', error);
    return false;
  }
}

export async function checkEASHealth(checkSchema: boolean = false): Promise<boolean> {
  const normalizedEnv = getEnvironment();
  const scanUrl = process.env[`EXPO_PUBLIC_NETWORK_SCAN_${normalizedEnv.toUpperCase()}`];
  const providerUrl = process.env[`EXPO_PUBLIC_NETWORK_PROVIDER_${normalizedEnv.toUpperCase()}`];
  
  if (!scanUrl || !providerUrl) {
    console.error('EAS Network URLs not configured');
    return false;
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), HEALTH_CHECK_TIMEOUT);

    // Check both the scan service and the blockchain provider
    const [scanResponse, providerResponse] = await Promise.all([
      fetch(scanUrl, {
        method: 'GET',
        signal: controller.signal
      }).catch(() => ({ status: 500 })),
      fetch(providerUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'net_version',
          params: [],
          id: 1
        }),
        signal: controller.signal
      }).catch(() => ({ status: 500 }))
    ]);

    clearTimeout(timeoutId);

    // Both services need to be healthy
    const isHealthy = scanResponse.status === 200 && providerResponse.status === 200;

    if (!isHealthy) {
      console.error('EAS health check failed:', {
        scanStatus: scanResponse.status,
        providerStatus: providerResponse.status
      });
    }

    return isHealthy;
  } catch (error) {
    console.error('EAS health check failed:', error);
    return false;
  }
}

export async function checkServicesHealth(checkEASSchema: boolean = false): Promise<{
  directus: boolean;
  eas: boolean;
  allHealthy: boolean;
}> {
  const [directusHealth, easHealth] = await Promise.all([
    checkDirectusHealth(),
    checkEASHealth(checkEASSchema)
  ]);

  return {
    directus: directusHealth,
    eas: easHealth,
    allHealthy: directusHealth && easHealth
  };
} 