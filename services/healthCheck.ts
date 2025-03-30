import { getAPIUrl, getNetworkConfig } from "@/utils/env";

export interface HealthCheckResult {
  directus: {
    status: "healthy" | "unhealthy";
    message?: string;
    timestamp: string;
  };
  eas: {
    status: "healthy" | "unhealthy";
    message?: string;
    timestamp: string;
  };
}

export async function checkDirectusHealth(): Promise<HealthCheckResult["directus"]> {
  try {
    const apiUrl = getAPIUrl();
    const response = await fetch(`${apiUrl}/health`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return {
      status: "healthy",
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    return {
      status: "unhealthy",
      message: error instanceof Error ? error.message : "Unknown error occurred",
      timestamp: new Date().toISOString()
    };
  }
}

export async function checkEASHealth(): Promise<HealthCheckResult["eas"]> {
  try {
    const { providerUrl } = getNetworkConfig();
    const response = await fetch(providerUrl);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return {
      status: "healthy",
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    return {
      status: "unhealthy",
      message: error instanceof Error ? error.message : "Unknown error occurred",
      timestamp: new Date().toISOString()
    };
  }
}

export async function checkHealth(): Promise<HealthCheckResult> {
  const [directusHealth, easHealth] = await Promise.all([
    checkDirectusHealth(),
    checkEASHealth()
  ]);

  return {
    directus: directusHealth,
    eas: easHealth
  };
} 