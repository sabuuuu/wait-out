import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Collection } from "@/lib/types";

export function useCollections() {
  const queryClient = useQueryClient();

  const { data: collections = [], isLoading } = useQuery({
    queryKey: ["collections"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
      
      const { data, error } = await supabase
        .from("collections")
        .select("*")
        .eq("user_id", user.id)
        .order("sort_order", { ascending: true });
        
      if (error) throw error;
      return data as Collection[];
    },
  });

  const addCollectionMutation = useMutation({
    mutationFn: async (newCol: Omit<Collection, "id" | "created_at">) => {
      const { data, error } = await supabase
        .from("collections")
        .insert(newCol)
        .select()
        .single();
      if (error) throw error;
      return data as Collection;
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["collections"] }),
  });

  const updateCollectionMutation = useMutation({
    mutationFn: async (updatedCol: Partial<Collection> & { id: string }) => {
      const { data, error } = await supabase
        .from("collections")
        .update(updatedCol)
        .eq("id", updatedCol.id)
        .select()
        .single();
      if (error) throw error;
      return data as Collection;
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["collections"] }),
  });

  const deleteCollectionMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("collections")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["collections"] });
      queryClient.invalidateQueries({ queryKey: ["items"] }); // Invalidate items since their collection might be gone
    },
  });

  return {
    collections,
    isLoading,
    addCollection: addCollectionMutation.mutateAsync,
    updateCollection: updateCollectionMutation.mutateAsync,
    deleteCollection: deleteCollectionMutation.mutateAsync,
  };
}
