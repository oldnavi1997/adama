import fs from "node:fs";
import path from "node:path";

type WooCategoryRef = {
  id: number;
  name: string;
  slug: string;
};

type WooProduct = {
  id: number;
  name: string;
  description: string;
  short_description: string;
  price: string;
  regular_price: string;
  sale_price: string;
  status: string;
  stock_quantity: number | null;
  manage_stock: boolean;
  categories: WooCategoryRef[];
  images: Array<{ src: string }>;
};

type WooCategory = {
  id: number;
  name: string;
  parent: number;
};

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

type BackendCategory = {
  id: string;
  name: string;
  parent_id: string | null;
};

const requiredEnv = [
  "WOO_URL",
  "WOO_CONSUMER_KEY",
  "WOO_CONSUMER_SECRET",
  "API_BASE_URL",
  "ADMIN_TOKEN"
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
  if (!fs.existsSync(envPath)) {
    return;
  }

  const utf8Parsed = parseEnvText(fs.readFileSync(envPath, "utf8"));
  const utf16Parsed = parseEnvText(fs.readFileSync(envPath, "utf16le"));
  const score = (parsed: Record<string, string>): number =>
    Object.keys(parsed).filter((key) => /^[A-Z0-9_]+$/.test(key)).length;
  const parsed =
    score(utf16Parsed) > score(utf8Parsed) ||
    (!("WOO_URL" in utf8Parsed) && "WOO_URL" in utf16Parsed)
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

function stripHtml(raw: string): string {
  return raw.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function normalize(value: string): string {
  return value.trim().toLowerCase();
}

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, init);
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`HTTP ${response.status} ${response.statusText} -> ${url}\n${text}`);
  }
  return (await response.json()) as T;
}

function withWooAuth(baseUrl: string, key: string, secret: string, pathAndQuery: string): string {
  const url = new URL(pathAndQuery, baseUrl);
  url.searchParams.set("consumer_key", key);
  url.searchParams.set("consumer_secret", secret);
  return url.toString();
}

async function fetchAllWooProducts(baseUrl: string, key: string, secret: string): Promise<WooProduct[]> {
  const all: WooProduct[] = [];
  let page = 1;
  const perPage = 100;

  // Woo returns paginated arrays; stop when page comes empty.
  while (true) {
    const url = withWooAuth(baseUrl, key, secret, `/wp-json/wc/v3/products?per_page=${perPage}&page=${page}&status=any`);
    const chunk = await fetchJson<WooProduct[]>(url);
    if (chunk.length === 0) break;
    all.push(...chunk);
    page += 1;
  }

  return all;
}

async function fetchAllWooCategories(baseUrl: string, key: string, secret: string): Promise<WooCategory[]> {
  const all: WooCategory[] = [];
  let page = 1;
  const perPage = 100;

  while (true) {
    const url = withWooAuth(baseUrl, key, secret, `/wp-json/wc/v3/products/categories?per_page=${perPage}&page=${page}`);
    const chunk = await fetchJson<WooCategory[]>(url);
    if (chunk.length === 0) break;
    all.push(...chunk);
    page += 1;
  }

  return all;
}

async function backendRequest<T>(apiBase: string, token: string, path: string, init?: RequestInit): Promise<T> {
  const normalizedBase = apiBase.endsWith("/") ? apiBase : `${apiBase}/`;
  const normalizedPath = path.startsWith("/") ? path.slice(1) : path;
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

async function fetchAllBackendProducts(apiBase: string, token: string): Promise<BackendProduct[]> {
  const all: BackendProduct[] = [];
  let page = 1;
  const pageSize = 50;

  while (true) {
    const response = await backendRequest<BackendProductsResponse>(
      apiBase,
      token,
      `/products?page=${page}&pageSize=${pageSize}&includeInactive=true`
    );
    all.push(...response.data);
    if (all.length >= response.total || response.data.length === 0) break;
    page += 1;
  }

  return all;
}

async function main(): Promise<void> {
  loadEnvFromFile();

  for (const envVar of requiredEnv) getEnv(envVar);

  const wooUrl = getEnv("WOO_URL");
  const wooKey = getEnv("WOO_CONSUMER_KEY");
  const wooSecret = getEnv("WOO_CONSUMER_SECRET");
  const apiBase = getEnv("API_BASE_URL");
  const token = getEnv("ADMIN_TOKEN");

  const dryRun = toBool(process.env.DRY_RUN, true);
  const useShortDescription = toBool(process.env.WOO_USE_SHORT_DESCRIPTION, false);
  const fallbackStock = Math.max(0, Math.floor(toNumber(process.env.DEFAULT_STOCK, 0)));

  // eslint-disable-next-line no-console
  console.log(`[import:woo] starting (dryRun=${dryRun})`);

  const [wooProducts, wooCategories, backendProducts, backendCategories] = await Promise.all([
    fetchAllWooProducts(wooUrl, wooKey, wooSecret),
    fetchAllWooCategories(wooUrl, wooKey, wooSecret),
    fetchAllBackendProducts(apiBase, token),
    backendRequest<BackendCategory[]>(apiBase, token, "/products/categories")
  ]);

  const backendProductsByName = new Map(backendProducts.map((product) => [normalize(product.name), product]));
  const backendCategoriesByName = new Map(backendCategories.map((category) => [normalize(category.name), category]));
  const wooCategoriesById = new Map(wooCategories.map((category) => [category.id, category]));

  let createdCategories = 0;
  let createdProducts = 0;
  let updatedProducts = 0;
  let skippedProducts = 0;

  // Create categories preserving parent-child where possible.
  const pendingCategories = [...wooCategories];
  let loopGuard = 0;
  while (pendingCategories.length > 0 && loopGuard < 10_000) {
    loopGuard += 1;
    const category = pendingCategories.shift()!;
    const normalizedName = normalize(category.name);
    if (!normalizedName) continue;
    if (backendCategoriesByName.has(normalizedName)) continue;

    const parent = category.parent ? wooCategoriesById.get(category.parent) : undefined;
    const parentId = parent ? backendCategoriesByName.get(normalize(parent.name))?.id ?? null : null;
    const parentMissing = category.parent && !parentId;
    if (parentMissing) {
      pendingCategories.push(category);
      continue;
    }

    if (!dryRun) {
      const created = await backendRequest<{ id: string; name: string; parentId?: string | null }>(
        apiBase,
        token,
        "/products/categories",
        {
          method: "POST",
          body: JSON.stringify({ name: category.name, parentId })
        }
      );
      backendCategoriesByName.set(normalizedName, { id: created.id, name: created.name, parent_id: parentId });
    } else {
      backendCategoriesByName.set(normalizedName, {
        id: `dry-${category.id}`,
        name: category.name,
        parent_id: parentId
      });
    }

    createdCategories += 1;
    // eslint-disable-next-line no-console
    console.log(`[category] ${dryRun ? "would create" : "created"}: ${category.name}`);
  }

  for (const wooProduct of wooProducts) {
    const name = wooProduct.name?.trim();
    if (!name || name.length < 2) {
      skippedProducts += 1;
      // eslint-disable-next-line no-console
      console.log(`[product] skipped invalid name (wooId=${wooProduct.id})`);
      continue;
    }

    const baseDescription = useShortDescription ? wooProduct.short_description : wooProduct.description;
    const description = stripHtml(baseDescription || wooProduct.short_description || wooProduct.description || "");
    if (description.length < 2) {
      skippedProducts += 1;
      // eslint-disable-next-line no-console
      console.log(`[product] skipped missing description: ${name}`);
      continue;
    }

    const priceRaw = wooProduct.price || wooProduct.sale_price || wooProduct.regular_price;
    const price = Number(priceRaw);
    if (!Number.isFinite(price) || price <= 0) {
      skippedProducts += 1;
      // eslint-disable-next-line no-console
      console.log(`[product] skipped invalid price: ${name} (price='${priceRaw || ""}')`);
      continue;
    }

    const stock =
      typeof wooProduct.stock_quantity === "number" && Number.isFinite(wooProduct.stock_quantity)
        ? Math.max(0, Math.floor(wooProduct.stock_quantity))
        : fallbackStock;

    const primaryCategory = wooProduct.categories[0]?.name?.trim() || "";
    const imageUrls = wooProduct.images
      .map((image) => String(image.src ?? "").trim())
      .filter((value) => value.length > 0);
    const imageUrl = imageUrls[0] || "";
    const payload = {
      name,
      description,
      imageUrl,
      imageUrls,
      category: primaryCategory,
      price,
      stock,
      isActive: wooProduct.status === "publish"
    };

    const existing = backendProductsByName.get(normalize(name));
    if (existing) {
      updatedProducts += 1;
      if (!dryRun) {
        await backendRequest(apiBase, token, `/products/${existing.id}`, {
          method: "PUT",
          body: JSON.stringify(payload)
        });
      }
      // eslint-disable-next-line no-console
      console.log(`[product] ${dryRun ? "would update" : "updated"}: ${name}`);
      continue;
    }

    createdProducts += 1;
    if (!dryRun) {
      await backendRequest(apiBase, token, "/products", {
        method: "POST",
        body: JSON.stringify(payload)
      });
    }
    // eslint-disable-next-line no-console
    console.log(`[product] ${dryRun ? "would create" : "created"}: ${name}`);
  }

  // eslint-disable-next-line no-console
  console.log("\n[import:woo] summary");
  // eslint-disable-next-line no-console
  console.log(`- categories ${dryRun ? "to create" : "created"}: ${createdCategories}`);
  // eslint-disable-next-line no-console
  console.log(`- products ${dryRun ? "to create" : "created"}: ${createdProducts}`);
  // eslint-disable-next-line no-console
  console.log(`- products ${dryRun ? "to update" : "updated"}: ${updatedProducts}`);
  // eslint-disable-next-line no-console
  console.log(`- products skipped: ${skippedProducts}`);
}

main().catch((error) => {
  // eslint-disable-next-line no-console
  console.error("[import:woo] failed:", error);
  process.exit(1);
});
