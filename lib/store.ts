import { create } from "zustand";
import { WishlistItem, Collection, NotificationPrefs } from "./types";

interface AppStore {
  // Items
  items:          WishlistItem[];
  setItems:       (items: WishlistItem[]) => void;
  upsertItem:     (item: WishlistItem) => void;
  removeItem:     (id: string) => void;

  // Collections
  collections:    Collection[];
  setCollections: (cols: Collection[]) => void;
  upsertCollection: (col: Collection) => void;
  removeCollection: (id: string) => void;

  // Active filter
  activeCollectionId: string | null;
  setActiveCollection: (id: string | null) => void;

  // Notification prefs
  notifPrefs:    NotificationPrefs | null;
  setNotifPrefs: (prefs: NotificationPrefs) => void;
}

export const useAppStore = create<AppStore>((set) => ({
  items:       [],
  setItems:    (items)       => set({ items }),
  upsertItem:  (item)        => set((s) => ({
    items: s.items.find((i) => i.id === item.id)
      ? s.items.map((i) => i.id === item.id ? item : i)
      : [item, ...s.items],
  })),
  removeItem:  (id)          => set((s) => ({ items: s.items.filter((i) => i.id !== id) })),

  collections: [],
  setCollections: (cols)     => set({ collections: cols }),
  upsertCollection: (col)    => set((s) => ({
    collections: s.collections.find((c) => c.id === col.id)
      ? s.collections.map((c) => c.id === col.id ? col : c)
      : [...s.collections, col],
  })),
  removeCollection: (id)     => set((s) => ({
    collections: s.collections.filter((c) => c.id !== id),
  })),

  activeCollectionId: null,
  setActiveCollection: (id)  => set({ activeCollectionId: id }),

  notifPrefs:    null,
  setNotifPrefs: (prefs)     => set({ notifPrefs: prefs }),
}));
