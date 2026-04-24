import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { WishlistItem } from "@/lib/types";

export function useItems() {
  const queryClient = useQueryClient();

  // Fetch Items
  const { data: items = [], isLoading, error } = useQuery({
    queryKey: ["items"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from("items")
        .select("*")
        .eq("user_id", user.id)
        .order("added_at", { ascending: false });

      if (error) throw error;
      return data as WishlistItem[];
    },
  });

  const addItemMutation = useMutation({
    mutationFn: async (newItem: Omit<WishlistItem, "id" | "updated_at">) => {
      const { data, error } = await supabase
        .from("items")
        .insert(newItem)
        .select()
        .single();

      if (error) throw error;
      return data as WishlistItem;
    },
    onMutate: async (newItem) => {
      await queryClient.cancelQueries({ queryKey: ["items"] });
      const previousItems = queryClient.getQueryData<WishlistItem[]>(["items"]);

      const optimisticItem = {
        ...newItem,
        id: Math.random().toString(36).substring(7),
        updated_at: new Date().toISOString(),
      } as WishlistItem;

      queryClient.setQueryData<WishlistItem[]>(["items"], (old) => [optimisticItem, ...(old || [])]);

      return { previousItems };
    },
    onError: (err, newItem, context) => {
      if (context?.previousItems) {
        queryClient.setQueryData(["items"], context.previousItems);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["items"] });
    },
  });

  const updateItemMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: WishlistItem["status"] }) => {
      const { data, error } = await supabase
        .from("items")
        .update({ status, updated_at: new Date().toISOString() })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data as WishlistItem;
    },
    onMutate: async ({ id, status }) => {
      await queryClient.cancelQueries({ queryKey: ["items"] });
      const previousItems = queryClient.getQueryData<WishlistItem[]>(["items"]);

      queryClient.setQueryData<WishlistItem[]>(["items"], (old) =>
        old?.map(item => item.id === id ? { ...item, status } : item)
      );

      return { previousItems };
    },
    onError: (err, variables, context) => {
      if (context?.previousItems) {
        queryClient.setQueryData(["items"], context.previousItems);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["items"] });
    },
  });

  const deleteItemMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("items").delete().eq("id", id);
      if (error) throw error;
      return id;
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ["items"] });
      const previousItems = queryClient.getQueryData<WishlistItem[]>(["items"]);

      queryClient.setQueryData<WishlistItem[]>(["items"], (old) =>
        old?.filter(item => item.id !== id)
      );

      return { previousItems };
    },
    onError: (err, id, context) => {
      if (context?.previousItems) {
        queryClient.setQueryData(["items"], context.previousItems);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["items"] });
    },
  });

  return {
    items,
    isLoading,
    error,
    addItem: addItemMutation.mutateAsync,
    updateItem: updateItemMutation.mutateAsync,
    deleteItem: deleteItemMutation.mutateAsync,
    isAdding: addItemMutation.isPending,
  };
}
