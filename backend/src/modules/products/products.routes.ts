import { Router } from "express";
import { UserRole } from "@prisma/client";
import crypto from "crypto";
import { prisma } from "../../lib/prisma.js";
import { requireAuth, requireRole } from "../../middleware/auth.js";
import { validateBody } from "../../middleware/validate.js";
import { productSchema } from "./products.schema.js";
import { verifyAccessToken } from "../../lib/auth.js";

export const productsRouter = Router();

type CategoryRow = { id: string; name: string; parent_id: string | null; parent_name: string | null };
type CategoryNameRow = { id: string; name: string };

type PublicCategoryNode = {
  id: string;
  name: string;
  slug: string;
  count: number;
  children: PublicCategoryNode[];
};
function normalizeCategoryName(value: unknown): string {
  return String(value ?? "").trim();
}

function normalizeImageUrls(imageUrls: unknown): string[] {
  if (!Array.isArray(imageUrls)) {
    return [];
  }

  return imageUrls
    .map((value) => String(value ?? "").trim())
    .filter((value) => value.length > 0);
}

function toSlug(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function ensureCategoriesTable(): Promise<void> {
  await prisma.$executeRawUnsafe(
    'CREATE TABLE IF NOT EXISTS "categories" ("id" TEXT PRIMARY KEY, "name" TEXT NOT NULL, "parent_id" TEXT NULL, "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP)'
  );
  await prisma.$executeRawUnsafe('CREATE UNIQUE INDEX IF NOT EXISTS "categories_name_key" ON "categories"("name")');
  await prisma.$executeRawUnsafe('ALTER TABLE "categories" ADD COLUMN IF NOT EXISTS "parent_id" TEXT NULL');
  await prisma.$executeRawUnsafe(`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'categories_parent_id_fkey'
      ) THEN
        ALTER TABLE "categories"
        ADD CONSTRAINT "categories_parent_id_fkey"
        FOREIGN KEY ("parent_id")
        REFERENCES "categories"("id")
        ON DELETE SET NULL;
      END IF;
    END
    $$;
  `);
}

async function syncCategoriesFromProducts(): Promise<void> {
  await ensureCategoriesTable();
  const dbCategories = await prisma.$queryRaw<Array<CategoryNameRow>>`SELECT id, name FROM categories ORDER BY name ASC`;
  const known = new Set(dbCategories.map((category) => category.name.toLowerCase()));
  const productCategories = await prisma.product.findMany({
    where: { category: { not: null } },
    select: { category: true },
    distinct: ["category"]
  });

  for (const productCategory of productCategories) {
    const normalized = normalizeCategoryName(productCategory.category);
    if (!normalized) continue;
    if (known.has(normalized.toLowerCase())) continue;

    await prisma.$executeRaw`INSERT INTO categories (id, name) VALUES (${crypto.randomUUID()}, ${normalized})`;
    known.add(normalized.toLowerCase());
  }
}

productsRouter.get("/", async (req, res) => {
  const page = Math.max(Number(req.query.page ?? 1), 1);
  const pageSize = Math.min(Math.max(Number(req.query.pageSize ?? 10), 1), 50);
  const search = String(req.query.search ?? "").trim();
  const category = String(req.query.category ?? "").trim();
  const sortBy = String(req.query.sortBy ?? "latest").trim();
  const categories = String(req.query.categories ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
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
    ...(categories.length > 0 ? { category: { in: categories } } : category ? { category } : {})
  };

  const products = await prisma.product.findMany({
    where: productWhere,
    orderBy:
      sortBy === "price-asc"
        ? { price: "asc" }
        : sortBy === "price-desc"
          ? { price: "desc" }
          : sortBy === "name-asc"
            ? { name: "asc" }
            : sortBy === "name-desc"
              ? { name: "desc" }
              : { createdAt: "desc" },
    skip: (page - 1) * pageSize,
    take: pageSize
  });

  const total = await prisma.product.count({ where: productWhere });

  res.json({ data: products, page, pageSize, total });
});

productsRouter.get("/categories/public", async (_req, res) => {
  await syncCategoriesFromProducts();

  const categories = await prisma.$queryRaw<Array<CategoryRow>>`
    SELECT c.id, c.name, c.parent_id, p.name as parent_name
    FROM categories c
    LEFT JOIN categories p ON p.id = c.parent_id
    ORDER BY c.name ASC
  `;

  const grouped = await prisma.product.groupBy({
    by: ["category"],
    where: { isActive: true, category: { not: null } },
    _count: { _all: true }
  });
  const countByName = new Map(
    grouped
      .filter((row) => normalizeCategoryName(row.category).length > 0)
      .map((row) => [normalizeCategoryName(row.category), row._count._all])
  );

  const byParent = new Map<string | null, CategoryRow[]>();
  categories.forEach((category) => {
    const parentKey = category.parent_id ?? null;
    const current = byParent.get(parentKey) ?? [];
    current.push(category);
    byParent.set(parentKey, current);
  });

  const buildTree = (parentId: string | null): PublicCategoryNode[] => {
    const nodes = byParent.get(parentId) ?? [];
    return nodes.map((node) => {
      const children = buildTree(node.id);
      const ownCount = countByName.get(node.name) ?? 0;
      const childCount = children.reduce((sum, child) => sum + child.count, 0);
      return {
        id: node.id,
        name: node.name,
        slug: toSlug(node.name),
        count: ownCount + childCount,
        children
      };
    });
  };

  res.json(buildTree(null));
});

productsRouter.get("/categories", requireAuth, requireRole(UserRole.ADMIN), async (_req, res) => {
  await syncCategoriesFromProducts();
  const categories = await prisma.$queryRaw<Array<CategoryRow>>`
    SELECT c.id, c.name, c.parent_id, p.name as parent_name
    FROM categories c
    LEFT JOIN categories p ON p.id = c.parent_id
    ORDER BY c.name ASC
  `;
  res.json(categories);
});

productsRouter.post("/categories", requireAuth, requireRole(UserRole.ADMIN), async (req, res) => {
  await ensureCategoriesTable();
  const name = normalizeCategoryName(req.body?.name);
  const parentId = normalizeCategoryName(req.body?.parentId) || null;
  if (name.length < 2) {
    res.status(400).json({ message: "Category name must contain at least 2 characters" });
    return;
  }

  const duplicates = await prisma.$queryRaw<Array<CategoryNameRow>>`SELECT id, name FROM categories WHERE LOWER(name) = LOWER(${name})`;
  if (duplicates.length > 0) {
    res.status(409).json({ message: "Category already exists" });
    return;
  }

  if (parentId) {
    const parentRows = await prisma.$queryRaw<Array<CategoryNameRow>>`SELECT id, name FROM categories WHERE id = ${parentId} LIMIT 1`;
    if (parentRows.length === 0) {
      res.status(400).json({ message: "Parent category not found" });
      return;
    }
  }

  const id = crypto.randomUUID();
  await prisma.$executeRaw`INSERT INTO categories (id, name, parent_id) VALUES (${id}, ${name}, ${parentId})`;
  res.status(201).json({ id, name, parentId });
});

productsRouter.patch("/categories/:id", requireAuth, requireRole(UserRole.ADMIN), async (req, res) => {
  await ensureCategoriesTable();
  const id = req.params.id;
  const name = normalizeCategoryName(req.body?.name);
  const parentId = normalizeCategoryName(req.body?.parentId) || null;
  if (name.length < 2) {
    res.status(400).json({ message: "Category name must contain at least 2 characters" });
    return;
  }

  const currentRows = await prisma.$queryRaw<Array<CategoryNameRow>>`SELECT id, name FROM categories WHERE id = ${id} LIMIT 1`;
  const current = currentRows[0];
  if (!current) {
    res.status(404).json({ message: "Category not found" });
    return;
  }

  if (parentId === id) {
    res.status(400).json({ message: "Category cannot be parent of itself" });
    return;
  }

  if (parentId) {
    const parentRows = await prisma.$queryRaw<Array<CategoryNameRow>>`SELECT id, name FROM categories WHERE id = ${parentId} LIMIT 1`;
    if (parentRows.length === 0) {
      res.status(400).json({ message: "Parent category not found" });
      return;
    }
  }

  const duplicateRows =
    await prisma.$queryRaw<Array<CategoryNameRow>>`SELECT id, name FROM categories WHERE LOWER(name) = LOWER(${name}) AND id <> ${id}`;
  if (duplicateRows.length > 0) {
    res.status(409).json({ message: "Category already exists" });
    return;
  }

  await prisma.$transaction([
    prisma.$executeRaw`UPDATE categories SET name = ${name}, parent_id = ${parentId}, updated_at = NOW() WHERE id = ${id}`,
    prisma.product.updateMany({
      where: { category: current.name },
      data: { category: name }
    })
  ]);

  res.json({ id, name, parentId });
});

productsRouter.delete("/categories/:id", requireAuth, requireRole(UserRole.ADMIN), async (req, res) => {
  await ensureCategoriesTable();
  const id = req.params.id;
  const currentRows = await prisma.$queryRaw<Array<CategoryNameRow>>`SELECT id, name FROM categories WHERE id = ${id} LIMIT 1`;
  const current = currentRows[0];
  if (!current) {
    res.status(404).json({ message: "Category not found" });
    return;
  }

  await prisma.$transaction([
    prisma.$executeRaw`UPDATE categories SET parent_id = NULL WHERE parent_id = ${id}`,
    prisma.product.updateMany({
      where: { category: current.name },
      data: { category: null }
    }),
    prisma.$executeRaw`DELETE FROM categories WHERE id = ${id}`
  ]);

  res.status(204).send();
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
  const imageUrls = normalizeImageUrls(payload.imageUrls);
  const imageUrl = String(payload.imageUrl ?? "").trim() || imageUrls[0] || "";
  const product = await prisma.product.create({
    data: {
      ...payload,
      imageUrl,
      imageUrls,
      price: payload.price.toFixed(2)
    }
  });
  res.status(201).json(product);
});

productsRouter.put("/:id", requireAuth, requireRole(UserRole.ADMIN), validateBody(productSchema), async (req, res) => {
  const payload = req.body;
  const imageUrls = normalizeImageUrls(payload.imageUrls);
  const imageUrl = String(payload.imageUrl ?? "").trim() || imageUrls[0] || "";
  const product = await prisma.product.update({
    where: { id: req.params.id },
    data: {
      ...payload,
      imageUrl,
      imageUrls,
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
