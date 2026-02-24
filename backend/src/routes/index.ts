import { Router } from "express";
import { authRouter } from "../modules/auth/auth.routes.js";
import { productsRouter } from "../modules/products/products.routes.js";
import { ordersRouter } from "../modules/orders/orders.routes.js";
import { paymentsRouter } from "../modules/payments/payments.routes.js";
import { mediaRouter } from "../modules/media/media.routes.js";

export const apiRouter = Router();

apiRouter.get("/health", (_req, res) => {
  res.json({ ok: true });
});

apiRouter.use("/auth", authRouter);
apiRouter.use("/products", productsRouter);
apiRouter.use("/orders", ordersRouter);
apiRouter.use("/payments", paymentsRouter);
apiRouter.use("/media", mediaRouter);
