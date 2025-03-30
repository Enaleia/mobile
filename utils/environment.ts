type Environment = "development" | "production" | "preview";

/**
 * Gets the normalized environment name
 * @returns The normalized environment name (development, production, or preview)
 */
export const getEnvironment = (): Environment => {
  // In development mode:
  // 1. __DEV__ is true when running in Expo Go or development client
  // 2. process.env.NODE_ENV === "development" when running in development mode
  // 3. Explicitly set NODE_ENV in .env takes precedence
  if (
    __DEV__ || 
    process.env.NODE_ENV === "development" ||
    process.env.EXPO_PUBLIC_FORCE_DEVELOPMENT === "true"
  ) {
    return "development";
  }
  
  // For production builds
  return "production";
}; 