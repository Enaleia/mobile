type Environment = "development" | "production" | "preview";

/**
 * Gets the normalized environment name
 * @returns The normalized environment name (development, production, or preview)
 */
export const getEnvironment = (): Environment => {
  const env = (process.env.NODE_ENV || "development") as string;
  if (env === "production") return "production";
  if (env === "preview") return "development"; // Treat preview same as development
  return "development";
}; 