import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { WishlistItem } from "@/lib/types";
import { nanoid } from "nanoid/non-secure";

export function useItems() {
  const queryClient = useQueryClient();

  // Fetch Items
  const { data: items = [], isLoading, error } = useQuery({
    queryKey: ["items"],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      console.log('🔍 useItems: Session User ID:', session?.user?.id);
      
      if (!session) {
        console.log('⚠️ useItems: No session found');
        return [];
      }

      const { data, error } = await supabase
        .from("items")
        .select("*")
        .eq("user_id", session.user.id)
        .order("added_at", { ascending: false });

      if (error) {
        console.error('❌ useItems: Supabase Error:', error);
        throw error;
      }
      
      console.log(`✅ useItems: Fetched ${data?.length || 0} items`);
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

      // Use nanoid for a collision-safe temporary ID.
      // Math.random() IDs caused "Item not found" if the user navigated
      // to the item detail screen during the optimistic window.
      const optimisticItem = {
        ...newItem,
        id: nanoid(),
        updated_at: new Date().toISOString(),
      } as WishlistItem;

      queryClient.setQueryData<WishlistItem[]>(["items"], (old) => [optimisticItem, ...(old || [])]);

      return { previousItems };
    },
    onError: (_err, _newItem, context) => {
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
    onError: (_err, _variables, context) => {
      if (context?.previousItems) {
        queryClient.setQueryData(["items"], context.previousItems);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["items"] });
    },
  });

  // Separate mutation for recording an outcome so OutcomePrompt doesn't
  // write to Supabase directly and bypass the React Query cache.
  const updateOutcomeMutation = useMutation({
    mutationFn: async ({
      id,
      outcome,
    }: {
      id: string;
      outcome: "regretted" | "happy" | "neutral";
    }) => {
      const { data, error } = await supabase
        .from("items")
        .update({ outcome, outcome_set_at: new Date().toISOString() })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data as WishlistItem;
    },
    onMutate: async ({ id, outcome }) => {
      await queryClient.cancelQueries({ queryKey: ["items"] });
      const previousItems = queryClient.getQueryData<WishlistItem[]>(["items"]);

      // Optimistically update the cache so labeledCount in MLScoreCard
      // reflects the new outcome immediately without waiting for a refetch.
      queryClient.setQueryData<WishlistItem[]>(["items"], (old) =>
        old?.map(item =>
          item.id === id
            ? { ...item, outcome, outcome_set_at: new Date().toISOString() }
            : item
        )
      );

      return { previousItems };
    },
    onError: (_err, _variables, context) => {
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
    onError: (_err, _id, context) => {
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
    updateOutcome: updateOutcomeMutation.mutateAsync,
    deleteItem: deleteItemMutation.mutateAsync,
    isAdding: addItemMutation.isPending,
  };
}
