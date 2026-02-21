import { z } from "zod";

export const orderSchema = z.object({
  guestEmail: z.string().email().optional(),
  address: z.object({
    fullName: z.string().min(2),
    phone: z.string().min(5),
    street: z.string().min(3),
    city: z.string().min(2),
    state: z.string().min(2),
    postalCode: z.string().min(3),
    country: z.string().min(2)
  }),
  items: z
    .array(
      z.object({
        productId: z.string().min(1),
        quantity: z.number().int().positive()
      })
    )
    .min(1)
});

export type CreateOrderInput = z.infer<typeof orderSchema>;
