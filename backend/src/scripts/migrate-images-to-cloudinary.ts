import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

type BackendProduct = {
  id: string;
  name: string;
  description: string;
  imageUrl?: string | null;
  imageUrls?: string[];
  category?: string | null;
  price: string | number;
  stock: number;
  isActive: boolean;
};

type BackendProductsResponse = {
  data: BackendProduct[];
  page: number;
  pageSize: number;
  total: number;
};

type CloudinaryUploadResponse = {
  secure_url?: string;
};

const requiredEnv = [
  "API_BASE_URL",
  "ADMIN_TOKEN",
  "CLOUDINARY_CLOUD_NAME",
  "CLOUDINARY_API_KEY",
  "CLOUDINARY_API_SECRET"
] as const;

function parseEnvText(content: string): Record<string, string> {
  const result: Record<string, string> = {};
  const lines = content.split(/\r?\n/);

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const eqIndex = line.indexOf("=");
    if (eqIndex <= 0) continue;
    const key = line.slice(0, eqIndex).trim();
    let value = line.slice(eqIndex + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    if (key && !(key in result)) {
      result[key] = value;
    }
  }

  return result;
}

function loadEnvFromFile(): void {
  const envPath = path.resolve(process.cwd(), ".env");
  if (!fs.existsSync(envPath)) return;

  const utf8Parsed = parseEnvText(fs.readFileSync(envPath, "utf8"));
  const utf16Parsed = parseEnvText(fs.readFileSync(envPath, "utf16le"));
  const score = (parsed: Record<string, string>): number =>
    Object.keys(parsed).filter((key) => /^[A-Z0-9_]+$/.test(key)).length;
  const parsed =
    score(utf16Parsed) > score(utf8Parsed) ||
    (!("API_BASE_URL" in utf8Parsed) && "API_BASE_URL" in utf16Parsed)
      ? utf16Parsed
      : utf8Parsed;

  for (const [key, value] of Object.entries(parsed)) {
    if (!(key in process.env)) {
      process.env[key] = value;
    }
  }
}

function getEnv(name: (typeof requiredEnv)[number]): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
}

function toBool(value: string | undefined, fallback: boolean): boolean {
  if (value === undefined) return fallback;
  const normalized = value.trim().toLowerCase();
  return normalized === "1" || normalized === "true" || normalized === "yes";
}

function toNumber(value: string | undefined, fallback: number): number {
  if (!value) return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function isCloudinaryUrl(value: string): boolean {
  return /(^https?:\/\/)?res\.cloudinary\.com\//i.test(value.trim());
}

function normalizeImageList(values: Array<string | null | undefined>): string[] {
  const output: string[] = [];
  for (const raw of values) {
    const value = String(raw ?? "").trim();
    if (!value) continue;
    if (output.includes(value)) continue;
    output.push(value);
  }
  return output;
}

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, init);
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`HTTP ${response.status} ${response.statusText} -> ${url}\n${text}`);
  }
  return (await response.json()) as T;
}

async function backendRequest<T>(apiBase: string, token: string, reqPath: string, init?: RequestInit): Promise<T> {
  const normalizedBase = apiBase.endsWith("/") ? apiBase : `${apiBase}/`;
  const normalizedPath = reqPath.startsWith("/") ? reqPath.slice(1) : reqPath;
  const url = new URL(normalizedPath, normalizedBase).toString();
  return fetchJson<T>(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(init?.headers ?? {})
    }
  });
}

async function fetchAllBackendProducts(
  apiBase: string,
  token: string,
  includeInactive: boolean,
  pageSize: number
): Promise<BackendProduct[]> {
  const all: BackendProduct[] = [];
  let page = 1;

  while (true) {
    const response = await backendRequest<BackendProductsResponse>(
      apiBase,
      token,
      `/products?page=${page}&pageSize=${pageSize}&includeInactive=${includeInactive ? "true" : "false"}`
    );
    all.push(...response.data);
    if (all.length >= response.total || response.data.length === 0) break;
    page += 1;
  }

  return all;
}

function buildCloudinarySignature(params: Record<string, string>, apiSecret: string): string {
  const payload = Object.keys(params)
    .sort((a, b) => a.localeCompare(b))
    .map((key) => `${key}=${params[key]}`)
    .join("&");
  return crypto
    .createHash("sha1")
    .update(`${payload}${apiSecret}`)
    .digest("hex");
}

async function uploadRemoteImageToCloudinary(args: {
  sourceUrl: string;
  cloudName: string;
  apiKey: string;
  apiSecret: string;
  folder: string;
}): Promise<string> {
  const sourceHash = crypto.createHash("sha1").update(args.sourceUrl).digest("hex").slice(0, 24);
  const publicId = `${args.folder}/${sourceHash}`;
  const timestamp = String(Math.floor(Date.now() / 1000));
  const signedParams: Record<string, string> = {
    folder: args.folder,
    overwrite: "true",
    public_id: publicId,
    timestamp
  };
  const signature = buildCloudinarySignature(signedParams, args.apiSecret);

  const body = new FormData();
  body.append("file", args.sourceUrl);
  body.append("api_key", args.apiKey);
  body.append("timestamp", timestamp);
  body.append("folder", args.folder);
  body.append("public_id", publicId);
  body.append("overwrite", "true");
  body.append("signature", signature);

  const endpoint = `https://api.cloudinary.com/v1_1/${args.cloudName}/image/upload`;
  const response = await fetch(endpoint, { method: "POST", body });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Cloudinary upload failed (${response.status}): ${text}`);
  }
  const payload = (await response.json()) as CloudinaryUploadResponse;
  const secureUrl = String(payload.secure_url ?? "").trim();
  if (!secureUrl) {
    throw new Error("Cloudinary upload succeeded but secure_url was empty.");
  }
  return secureUrl;
}

async function main(): Promise<void> {
  loadEnvFromFile();

  for (const envVar of requiredEnv) getEnv(envVar);

  const apiBase = getEnv("API_BASE_URL");
  const token = getEnv("ADMIN_TOKEN");
  const cloudName = getEnv("CLOUDINARY_CLOUD_NAME");
  const cloudinaryKey = getEnv("CLOUDINARY_API_KEY");
  const cloudinarySecret = getEnv("CLOUDINARY_API_SECRET");

  const dryRun = toBool(process.env.DRY_RUN, true);
  const includeInactive = toBool(process.env.INCLUDE_INACTIVE, true);
  const onlyNonCloudinary = toBool(process.env.ONLY_NON_CLOUDINARY, true);
  const pageSize = Math.max(1, Math.floor(toNumber(process.env.PRODUCT_PAGE_SIZE, 50)));
  const maxProducts = Math.max(0, Math.floor(toNumber(process.env.MAX_PRODUCTS, 0)));
  const folder = (process.env.CLOUDINARY_FOLDER ?? "adama/products").trim().replace(/\/+$/, "");

  // eslint-disable-next-line no-console
  console.log(`[migrate:cloudinary] starting (dryRun=${dryRun})`);
  // eslint-disable-next-line no-console
  console.log(
    `[migrate:cloudinary] includeInactive=${includeInactive} onlyNonCloudinary=${onlyNonCloudinary} folder=${folder}`
  );

  const allProducts = await fetchAllBackendProducts(apiBase, token, includeInactive, pageSize);
  const products = maxProducts > 0 ? allProducts.slice(0, maxProducts) : allProducts;
  const uploadedBySource = new Map<string, string>();

  let scanned = 0;
  let skippedNoImages = 0;
  let skippedAlreadyCloudinary = 0;
  let unchanged = 0;
  let updated = 0;
  let failed = 0;
  let uploads = 0;

  for (const product of products) {
    scanned += 1;
    const currentImageUrl = String(product.imageUrl ?? "").trim();
    const currentImageUrls = normalizeImageList(product.imageUrls ?? []);
    const sourceImages = normalizeImageList([currentImageUrl, ...currentImageUrls]);

    if (sourceImages.length === 0) {
      skippedNoImages += 1;
      continue;
    }

    const allAlreadyCloudinary = sourceImages.every((url) => isCloudinaryUrl(url));
    if (onlyNonCloudinary && allAlreadyCloudinary) {
      skippedAlreadyCloudinary += 1;
      continue;
    }

    const mappedBySource = new Map<string, string>();
    let productFailed = false;

    for (const sourceUrl of sourceImages) {
      if (isCloudinaryUrl(sourceUrl)) {
        mappedBySource.set(sourceUrl, sourceUrl);
        continue;
      }

      const cached = uploadedBySource.get(sourceUrl);
      if (cached) {
        mappedBySource.set(sourceUrl, cached);
        continue;
      }

      try {
        if (dryRun) {
          const simulated = `https://res.cloudinary.com/${cloudName}/image/upload/v-dry/${encodeURIComponent(
            sourceUrl
          )}`;
          mappedBySource.set(sourceUrl, simulated);
          uploadedBySource.set(sourceUrl, simulated);
        } else {
          const secureUrl = await uploadRemoteImageToCloudinary({
            sourceUrl,
            cloudName,
            apiKey: cloudinaryKey,
            apiSecret: cloudinarySecret,
            folder
          });
          uploads += 1;
          mappedBySource.set(sourceUrl, secureUrl);
          uploadedBySource.set(sourceUrl, secureUrl);
        }
      } catch (error) {
        productFailed = true;
        // eslint-disable-next-line no-console
        console.error(`[product] image upload failed: ${product.name} -> ${sourceUrl}`, error);
      }
    }

    if (productFailed && !dryRun) {
      failed += 1;
      continue;
    }

    const nextImageUrls = normalizeImageList(sourceImages.map((url) => mappedBySource.get(url) ?? url));
    const nextImageUrl = mappedBySource.get(currentImageUrl) ?? nextImageUrls[0] ?? "";

    const noChanges =
      currentImageUrl === nextImageUrl &&
      currentImageUrls.length === nextImageUrls.length &&
      currentImageUrls.every((value, index) => value === nextImageUrls[index]);

    if (noChanges) {
      unchanged += 1;
      continue;
    }

    const price = Number(product.price);
    if (!Number.isFinite(price) || price <= 0) {
      failed += 1;
      // eslint-disable-next-line no-console
      console.error(`[product] skipped invalid price for update: ${product.name} (price='${product.price}')`);
      continue;
    }

    if (!dryRun) {
      await backendRequest(apiBase, token, `/products/${product.id}`, {
        method: "PUT",
        body: JSON.stringify({
          name: product.name,
          description: product.description,
          imageUrl: nextImageUrl,
          imageUrls: nextImageUrls,
          category: String(product.category ?? ""),
          price,
          stock: product.stock,
          isActive: product.isActive
        })
      });
    }

    updated += 1;
    // eslint-disable-next-line no-console
    console.log(`[product] ${dryRun ? "would update" : "updated"}: ${product.name}`);
  }

  // eslint-disable-next-line no-console
  console.log("\n[migrate:cloudinary] summary");
  // eslint-disable-next-line no-console
  console.log(`- products scanned: ${scanned}`);
  // eslint-disable-next-line no-console
  console.log(`- products ${dryRun ? "to update" : "updated"}: ${updated}`);
  // eslint-disable-next-line no-console
  console.log(`- products unchanged: ${unchanged}`);
  // eslint-disable-next-line no-console
  console.log(`- products skipped (no images): ${skippedNoImages}`);
  // eslint-disable-next-line no-console
  console.log(`- products skipped (already cloudinary): ${skippedAlreadyCloudinary}`);
  // eslint-disable-next-line no-console
  console.log(`- products failed: ${failed}`);
  // eslint-disable-next-line no-console
  console.log(`- cloudinary uploads ${dryRun ? "simulated" : "performed"}: ${uploads}`);
}

main().catch((error) => {
  // eslint-disable-next-line no-console
  console.error("[migrate:cloudinary] failed:", error);
  process.exit(1);
});
