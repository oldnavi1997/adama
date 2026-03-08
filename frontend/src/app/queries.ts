import { QueryClient, useQuery } from "@tanstack/react-query";
import { api } from "./api";
import type { PublicCategory } from "./publicCategories";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 2 * 60 * 1000, retry: 1 },
  },
});

type Product = {
  id: string;
  name: string;
  description: string;
  price: string;
  stock: number;
  category?: string | null;
  imageUrl?: string | null;
  imageUrls?: string[];
  contentImages?: string[];
  productDetails?: string;
  sizeInfo?: string;
  sizes?: string[];
  engravingEnabled?: boolean;
};

type ProductsResponse = {
  data: Product[];
  page: number;
  pageSize: number;
  total: number;
};

export function usePublicCategories() {
  return useQuery<PublicCategory[]>({
    queryKey: ["categories"],
    queryFn: () => api<PublicCategory[]>("/products/categories/public"),
    staleTime: 10 * 60 * 1000,
  });
}

export function useProducts(search: string, category: string) {
  return useQuery<ProductsResponse>({
    queryKey: ["products", search, category],
    queryFn: () => {
      const params = new URLSearchParams({ search });
      if (category) params.set("category", category);
      return api<ProductsResponse>(`/products?${params.toString()}`);
    },
  });
}

export function useCategoryProducts(
  names: string[],
  page: number,
  sortBy: string
) {
  return useQuery<ProductsResponse>({
    queryKey: ["categoryProducts", names, page, sortBy],
    queryFn: () => {
      const categoryQuery =
        names.length > 1
          ? `categories=${encodeURIComponent(names.join(","))}`
          : `category=${encodeURIComponent(names[0] ?? "")}`;
      return api<ProductsResponse>(
        `/products?${categoryQuery}&sortBy=${encodeURIComponent(sortBy)}&page=${page}&pageSize=12`
      );
    },
    enabled: names.length > 0,
  });
}

export function useProduct(productId: string | null) {
  return useQuery<Product>({
    queryKey: ["product", productId],
    queryFn: () => api<Product>(`/products/${productId}`),
    enabled: !!productId,
    staleTime: 5 * 60 * 1000,
  });
}
