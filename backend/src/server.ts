import express from "express";
import cors from "cors";
import { env } from "./config/env.js";
import { apiRouter } from "./routes/index.js";
import { errorHandler } from "./middleware/error.js";
import { renderBackendHome } from "./ui/backend-home.js";

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
  // eslint-disable-next-line no-console
  console.log(`API listening on http://localhost:${env.port}`);
});
