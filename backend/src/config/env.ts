import "dotenv/config";

function required(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
}

export const env = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  port: Number(process.env.PORT ?? 4000),
  databaseUrl: required("DATABASE_URL", process.env.DATABASE_URL),
  frontendOrigin: process.env.FRONTEND_ORIGIN ?? "http://localhost:5173",
  adminOrigin: process.env.ADMIN_ORIGIN ?? "http://localhost:5174",
  logRequests: process.env.LOG_REQUESTS === "true",
  logWebhookEvents: process.env.LOG_WEBHOOK_EVENTS === "true",
  backendPublicUrl: process.env.BACKEND_PUBLIC_URL ?? "",
  jwtAccessSecret: required("JWT_ACCESS_SECRET", process.env.JWT_ACCESS_SECRET),
  jwtRefreshSecret: required("JWT_REFRESH_SECRET", process.env.JWT_REFRESH_SECRET),
  jwtAccessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN ?? "15m",
  jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN ?? "7d",
  mpAccessToken: process.env.MERCADOPAGO_ACCESS_TOKEN ?? "",
  mpWebhookSecret: process.env.MERCADOPAGO_WEBHOOK_SECRET ?? "",
  redisUrl: process.env.REDIS_URL ?? "",
  cloudinaryCloudName: process.env.CLOUDINARY_CLOUD_NAME ?? "",
  cloudinaryApiKey: process.env.CLOUDINARY_API_KEY ?? "",
  cloudinaryApiSecret: process.env.CLOUDINARY_API_SECRET ?? "",
  cloudinaryFolder: process.env.CLOUDINARY_FOLDER ?? "adama/products",
  skipPayment: process.env.SKIP_PAYMENT === "true"
};
