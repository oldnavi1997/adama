import { z } from "zod";

export const orderSchema = z.object({
  guestEmail: z.string().email().optional(),
  address: z.object({
    fullName: z.string().min(2),
    phone: z.string().min(5),
    documentType: z.string().optional().default(""),
    documentNumber: z.string().optional().default(""),
    street: z.string().min(3),
    district: z.string().optional().default(""),
    city: z.string().min(2),
    state: z.string().min(2),
    postalCode: z.string().min(3),
    country: z.string().min(2)
  }),
  items: z
    .array(
      z.object({
        productId: z.string().min(1),
        quantity: z.number().int().positive(),
        engravingText: z.string().max(20).optional()
      })
    )
    .min(1),
  courier: z.enum(["shalom", "olva"]).optional().default("shalom"),
  mpCommission: z.number().min(0).optional()
});

export type CreateOrderInput = z.infer<typeof orderSchema>;
