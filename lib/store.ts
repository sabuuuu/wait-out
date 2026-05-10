import { create } from "zustand";

// Zustand is used only for pure UI state that needs to be shared across
// the component tree without prop drilling.
//
// Items and collections are NOT stored here — TanStack Query is the
// source of truth for all server data. The dead state that used to live
// here (setItems, upsertItem, removeItem, setCollections, etc.) has been
// removed to eliminate confusion about which system is authoritative.

interface AlertState {
  visible: boolean;
  title: string;
  message: string;
  type?: "info" | "error" | "success";
}

interface AppStore {
  // Collection filter — which collection tab is active in the items screen
  activeCollectionId: string | null;
  setActiveCollection: (id: string | null) => void;

  // Global alert modal
  alert: AlertState;
  showAlert: (title: string, message: string, type?: "info" | "error" | "success") => void;
  hideAlert: () => void;
}

export const useAppStore = create<AppStore>((set) => ({
  activeCollectionId: null,
  setActiveCollection: (id) => set({ activeCollectionId: id }),

  alert: { visible: false, title: "", message: "", type: "info" },
  showAlert: (title, message, type = "info") =>
    set({ alert: { visible: true, title, message, type } }),
  hideAlert: () =>
    set((s) => ({ alert: { ...s.alert, visible: false } })),
}));
