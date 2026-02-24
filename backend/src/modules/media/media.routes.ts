import crypto from "node:crypto";
import { Router } from "express";
import { UserRole } from "@prisma/client";
import { requireAuth, requireRole } from "../../middleware/auth.js";
import { env } from "../../config/env.js";
import { prisma } from "../../lib/prisma.js";

export const mediaRouter = Router();

type MediaAssetRow = {
  id: string;
  url: string;
  resource_type: string;
  original_name: string | null;
  bytes: number | null;
  folder: string | null;
  created_by: string | null;
  created_at: Date;
};

function buildCloudinarySignature(params: Record<string, string>, apiSecret: string): string {
  const payload = Object.keys(params)
    .sort((a, b) => a.localeCompare(b))
    .map((key) => `${key}=${params[key]}`)
    .join("&");
  return crypto.createHash("sha1").update(`${payload}${apiSecret}`).digest("hex");
}

mediaRouter.post("/signature", requireAuth, requireRole(UserRole.ADMIN), (req, res) => {
  if (!env.cloudinaryCloudName || !env.cloudinaryApiKey || !env.cloudinaryApiSecret) {
    res.status(500).json({ message: "Cloudinary is not configured in backend env vars." });
    return;
  }

  const folder = String(req.body?.folder ?? env.cloudinaryFolder).trim() || env.cloudinaryFolder;
  const timestamp = String(Math.floor(Date.now() / 1000));
  const toSign = { folder, timestamp };
  const signature = buildCloudinarySignature(toSign, env.cloudinaryApiSecret);

  res.json({
    cloudName: env.cloudinaryCloudName,
    apiKey: env.cloudinaryApiKey,
    folder,
    timestamp,
    signature
  });
});

async function ensureMediaAssetsTable(): Promise<void> {
  await prisma.$executeRawUnsafe(
    'CREATE TABLE IF NOT EXISTS "media_assets" ("id" TEXT PRIMARY KEY, "url" TEXT NOT NULL, "resource_type" TEXT NOT NULL, "original_name" TEXT NULL, "bytes" INTEGER NULL, "folder" TEXT NULL, "created_by" TEXT NULL, "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP)'
  );
  await prisma.$executeRawUnsafe('CREATE UNIQUE INDEX IF NOT EXISTS "media_assets_url_key" ON "media_assets"("url")');
}

mediaRouter.get("/assets", requireAuth, requireRole(UserRole.ADMIN), async (req, res) => {
  await ensureMediaAssetsTable();

  const search = String(req.query.search ?? "").trim().toLowerCase();
  const type = String(req.query.type ?? "").trim().toLowerCase();
  const limit = Math.min(Math.max(Number(req.query.limit ?? 80), 1), 200);

  const rows = await prisma.$queryRaw<Array<MediaAssetRow>>`
    SELECT id, url, resource_type, original_name, bytes, folder, created_by, created_at
    FROM media_assets
    ORDER BY created_at DESC
    LIMIT ${limit}
  `;

  const filtered = rows.filter((row) => {
    const matchesType = !type || row.resource_type.toLowerCase() === type;
    if (!matchesType) return false;
    if (!search) return true;
    const source = `${row.original_name ?? ""} ${row.url} ${row.folder ?? ""}`.toLowerCase();
    return source.includes(search);
  });

  res.json(
    filtered.map((row) => ({
      id: row.id,
      url: row.url,
      resourceType: row.resource_type,
      originalName: row.original_name ?? "",
      bytes: row.bytes ?? 0,
      folder: row.folder ?? "",
      createdBy: row.created_by ?? "",
      createdAt: row.created_at
    }))
  );
});

mediaRouter.post("/assets", requireAuth, requireRole(UserRole.ADMIN), async (req, res) => {
  await ensureMediaAssetsTable();

  const url = String(req.body?.url ?? "").trim();
  const resourceTypeRaw = String(req.body?.resourceType ?? "raw").trim().toLowerCase();
  const resourceType =
    resourceTypeRaw === "image" || resourceTypeRaw === "video" || resourceTypeRaw === "raw"
      ? resourceTypeRaw
      : "raw";
  const originalName = String(req.body?.originalName ?? "").trim();
  const folder = String(req.body?.folder ?? "").trim();
  const bytes = Number(req.body?.bytes ?? 0);

  if (!url || !/^https?:\/\//i.test(url)) {
    res.status(400).json({ message: "Valid asset url is required." });
    return;
  }

  const id = crypto.randomUUID();
  await prisma.$executeRaw`
    INSERT INTO media_assets (id, url, resource_type, original_name, bytes, folder, created_by)
    VALUES (${id}, ${url}, ${resourceType}, ${originalName || null}, ${Number.isFinite(bytes) ? Math.max(0, Math.floor(bytes)) : 0}, ${folder || null}, ${req.auth?.userId ?? null})
    ON CONFLICT (url)
    DO UPDATE SET
      resource_type = EXCLUDED.resource_type,
      original_name = EXCLUDED.original_name,
      bytes = EXCLUDED.bytes,
      folder = EXCLUDED.folder
  `;

  const row = await prisma.$queryRaw<Array<MediaAssetRow>>`
    SELECT id, url, resource_type, original_name, bytes, folder, created_by, created_at
    FROM media_assets
    WHERE url = ${url}
    LIMIT 1
  `;

  const asset = row[0];
  res.status(201).json({
    id: asset.id,
    url: asset.url,
    resourceType: asset.resource_type,
    originalName: asset.original_name ?? "",
    bytes: asset.bytes ?? 0,
    folder: asset.folder ?? "",
    createdBy: asset.created_by ?? "",
    createdAt: asset.created_at
  });
});

mediaRouter.delete("/assets/:id", requireAuth, requireRole(UserRole.ADMIN), async (req, res) => {
  await ensureMediaAssetsTable();
  const id = String(req.params.id ?? "").trim();
  if (!id) {
    res.status(400).json({ message: "Asset id is required." });
    return;
  }

  await prisma.$executeRaw`DELETE FROM media_assets WHERE id = ${id}`;
  res.status(204).send();
});
