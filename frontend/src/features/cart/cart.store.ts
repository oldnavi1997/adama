import { create } from "zustand";

export type CartItem = {
  productId: string;
  name: string;
  price: number;
  quantity: number;
};

type CartState = {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "quantity">) => void;
  updateQty: (productId: string, quantity: number) => void;
  removeItem: (productId: string) => void;
  clear: () => void;
};

const persisted = localStorage.getItem("cartItems");
const initialItems: CartItem[] = persisted ? (JSON.parse(persisted) as CartItem[]) : [];

export const useCartStore = create<CartState>((set, get) => ({
  items: initialItems,
  addItem: (item) => {
    const exists = get().items.find((x) => x.productId === item.productId);
    const next = exists
      ? get().items.map((x) => (x.productId === item.productId ? { ...x, quantity: x.quantity + 1 } : x))
      : [...get().items, { ...item, quantity: 1 }];
    localStorage.setItem("cartItems", JSON.stringify(next));
    set({ items: next });
  },
  updateQty: (productId, quantity) => {
    const next = get()
      .items.map((x) => (x.productId === productId ? { ...x, quantity: Math.max(1, quantity) } : x))
      .filter((x) => x.quantity > 0);
    localStorage.setItem("cartItems", JSON.stringify(next));
    set({ items: next });
  },
  removeItem: (productId) => {
    const next = get().items.filter((x) => x.productId !== productId);
    localStorage.setItem("cartItems", JSON.stringify(next));
    set({ items: next });
  },
  clear: () => {
    localStorage.removeItem("cartItems");
    set({ items: [] });
  }
}));
