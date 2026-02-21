import { z } from "zod";

export const productSchema = z.object({
  name: z.string().min(2),
  description: z.string().min(2),
  imageUrl: z.string().url().optional().or(z.literal("")),
  category: z.string().min(2).optional().or(z.literal("")),
  price: z.number().positive(),
  stock: z.number().int().nonnegative(),
  isActive: z.boolean().optional()
});
