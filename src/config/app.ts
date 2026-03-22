export default {
  appName: process.env.APP_NAME ?? "BoxMetric Backend",
  port: Number(process.env.PORT) ?? 3450,
  allowedOrigins: process.env.CORS_ALLOWED_ORIGINS ? process.env.CORS_ALLOWED_ORIGINS.split(",") : ["http://localhost:3000"],
  internalApiKey: process.env.INTERNAL_API_KEY || "boxmetric-secret-dev",
  environment: process.env.NODE_ENV,
};
