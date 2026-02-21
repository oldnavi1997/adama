import { Router } from "express";
import { UserRole } from "@prisma/client";
import { prisma } from "../../lib/prisma.js";
import { requireAuth, requireRole } from "../../middleware/auth.js";
import { validateBody } from "../../middleware/validate.js";
import { productSchema } from "./products.schema.js";
import { verifyAccessToken } from "../../lib/auth.js";

export const productsRouter = Router();

productsRouter.get("/", async (req, res) => {
  const page = Math.max(Number(req.query.page ?? 1), 1);
  const pageSize = Math.min(Math.max(Number(req.query.pageSize ?? 10), 1), 50);
  const search = String(req.query.search ?? "").trim();
  const category = String(req.query.category ?? "").trim();
  const includeInactive = String(req.query.includeInactive ?? "false") === "true";

  let isAdmin = false;
  const header = req.headers.authorization;
  if (header?.startsWith("Bearer ")) {
    try {
      const payload = verifyAccessToken(header.replace("Bearer ", ""));
      isAdmin = payload.role === UserRole.ADMIN;
    } catch {
      isAdmin = false;
    }
  }

  const productWhere = {
    ...(includeInactive && isAdmin ? {} : { isActive: true }),
    ...(search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" as const } },
            { description: { contains: search, mode: "insensitive" as const } }
          ]
        }
      : {}),
    ...(category ? { category } : {})
  };

  const products = await prisma.product.findMany({
    where: productWhere,
    orderBy: { createdAt: "desc" },
    skip: (page - 1) * pageSize,
    take: pageSize
  });

  const total = await prisma.product.count({ where: productWhere });

  res.json({ data: products, page, pageSize, total });
});

productsRouter.get("/:id", async (req, res) => {
  const product = await prisma.product.findUnique({ where: { id: req.params.id } });
  if (!product || !product.isActive) {
    res.status(404).json({ message: "Product not found" });
    return;
  }
  res.json(product);
});

productsRouter.post("/", requireAuth, requireRole(UserRole.ADMIN), validateBody(productSchema), async (req, res) => {
  const payload = req.body;
  const product = await prisma.product.create({
    data: {
      ...payload,
      price: payload.price.toFixed(2)
    }
  });
  res.status(201).json(product);
});

productsRouter.put("/:id", requireAuth, requireRole(UserRole.ADMIN), validateBody(productSchema), async (req, res) => {
  const payload = req.body;
  const product = await prisma.product.update({
    where: { id: req.params.id },
    data: {
      ...payload,
      price: payload.price.toFixed(2)
    }
  });
  res.json(product);
});

productsRouter.patch("/:id/status", requireAuth, requireRole(UserRole.ADMIN), async (req, res) => {
  const isActive = Boolean(req.body?.isActive);
  const product = await prisma.product.update({
    where: { id: req.params.id },
    data: { isActive }
  });
  res.json(product);
});
