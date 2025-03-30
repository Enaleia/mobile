type Environment = "development" | "production" | "preview";

/**
 * Gets the normalized environment name
 * @returns The normalized environment name (development, production, or preview)
 */
export const getEnvironment = (): Environment => {
  const env = (process.env.NODE_ENV || "development") as string;
  return env === "production" ? "production" : "development";
}; 