import express from "express";
import cors from "cors";
import { env } from "./config/env.js";
import { apiRouter } from "./routes/index.js";
import { errorHandler } from "./middleware/error.js";
import { renderBackendHome } from "./ui/backend-home.js";
import { connectRedis } from "./lib/redis.js";

const app = express();

app.use(
  cors({
    origin(origin, callback) {
      if (!origin) {
        callback(null, true);
        return;
      }

      const allowedOrigins = new Set([env.frontendOrigin, env.adminOrigin]);
      callback(null, allowedOrigins.has(origin));
    }
  })
);
app.use(express.json());

if (env.logRequests) {
  app.use((req, res, next) => {
    const startedAt = Date.now();
    res.on("finish", () => {
      const durationMs = Date.now() - startedAt;
      // eslint-disable-next-line no-console
      console.log(`[HTTP] ${req.method} ${req.originalUrl} -> ${res.statusCode} (${durationMs}ms)`);
    });
    next();
  });
}

app.get("/", (_req, res) => {
  res.type("html").send(
    renderBackendHome({
      port: env.port,
      backendPublicUrl: env.backendPublicUrl
    })
  );
});

app.use("/api", apiRouter);
app.use(errorHandler);

app.listen(env.port, () => {
  connectRedis()
    .then(() => {
      // eslint-disable-next-line no-console
      console.log(`API listening on http://localhost:${env.port}`);
    })
    .catch((error) => {
      // eslint-disable-next-line no-console
      console.error("[redis] connect failed, continuing without redis features", error);
      // eslint-disable-next-line no-console
      console.log(`API listening on http://localhost:${env.port}`);
    });
});
