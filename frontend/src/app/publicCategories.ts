export type PublicCategory = {
  id: string;
  name: string;
  slug: string;
  count: number;
  children: PublicCategory[];
};

let cachedPublicCategories: PublicCategory[] | null = null;
let inFlightRequest: Promise<PublicCategory[]> | null = null;

export function getCachedPublicCategories(): PublicCategory[] | null {
  return cachedPublicCategories;
}

export function setCachedPublicCategories(categories: PublicCategory[]): void {
  cachedPublicCategories = categories;
}

export function fetchPublicCategories(
  fetcher: <T>(path: string) => Promise<T>
): Promise<PublicCategory[]> {
  if (cachedPublicCategories) {
    return Promise.resolve(cachedPublicCategories);
  }
  if (inFlightRequest) {
    return inFlightRequest;
  }

  inFlightRequest = fetcher<PublicCategory[]>("/products/categories/public")
    .then((categories) => {
      cachedPublicCategories = categories;
      return categories;
    })
    .finally(() => {
      inFlightRequest = null;
    });

  return inFlightRequest;
}
