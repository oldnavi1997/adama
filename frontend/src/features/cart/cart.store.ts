import { create } from "zustand";

export type CartItem = {
  productId: string;
  name: string;
  price: number;
  imageUrl?: string;
  quantity: number;
  engravingText?: string;
};

type ItemKey = { productId: string; engravingText?: string };

function sameKey(a: ItemKey, b: ItemKey) {
  return a.productId === b.productId && (a.engravingText ?? "") === (b.engravingText ?? "");
}

type CartState = {
  items: CartItem[];
  drawerOpen: boolean;
  addItem: (item: Omit<CartItem, "quantity">) => void;
  updateQty: (key: ItemKey, quantity: number) => void;
  removeItem: (key: ItemKey) => void;
  clear: () => void;
  openDrawer: () => void;
  closeDrawer: () => void;
};

const persisted = localStorage.getItem("cartItems");
const initialItems: CartItem[] = persisted ? (JSON.parse(persisted) as CartItem[]) : [];

export const useCartStore = create<CartState>((set, get) => ({
  items: initialItems,
  drawerOpen: false,
  openDrawer: () => set({ drawerOpen: true }),
  closeDrawer: () => set({ drawerOpen: false }),
  addItem: (item) => {
    const exists = get().items.find((x) => sameKey(x, item));
    const next = exists
      ? get().items.map((x) => (sameKey(x, item) ? { ...x, quantity: x.quantity + 1 } : x))
      : [...get().items, { ...item, quantity: 1 }];
    localStorage.setItem("cartItems", JSON.stringify(next));
    set({ items: next });
  },
  updateQty: (key, quantity) => {
    const next = get()
      .items.map((x) => (sameKey(x, key) ? { ...x, quantity: Math.max(1, quantity) } : x))
      .filter((x) => x.quantity > 0);
    localStorage.setItem("cartItems", JSON.stringify(next));
    set({ items: next });
  },
  removeItem: (key) => {
    const next = get().items.filter((x) => !sameKey(x, key));
    localStorage.setItem("cartItems", JSON.stringify(next));
    set({ items: next });
  },
  clear: () => {
    localStorage.removeItem("cartItems");
    set({ items: [] });
  }
}));
