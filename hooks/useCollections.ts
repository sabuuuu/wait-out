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
    onMutate: async (newCol) => {
      await queryClient.cancelQueries({ queryKey: ["collections"] });
      const previousCollections = queryClient.getQueryData<Collection[]>(["collections"]);

      const optimisticCol = {
        ...newCol,
        id: Math.random().toString(36).substring(7),
        created_at: new Date().toISOString(),
      } as Collection;

      queryClient.setQueryData<Collection[]>(["collections"], (old) => [...(old || []), optimisticCol]);

      return { previousCollections };
    },
    onError: (err, newCol, context) => {
      if (context?.previousCollections) {
        queryClient.setQueryData(["collections"], context.previousCollections);
      }
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
    onMutate: async (updatedCol) => {
      await queryClient.cancelQueries({ queryKey: ["collections"] });
      const previousCollections = queryClient.getQueryData<Collection[]>(["collections"]);

      queryClient.setQueryData<Collection[]>(["collections"], (old) =>
        old?.map(col => col.id === updatedCol.id ? { ...col, ...updatedCol } : col)
      );

      return { previousCollections };
    },
    onError: (err, updatedCol, context) => {
      if (context?.previousCollections) {
        queryClient.setQueryData(["collections"], context.previousCollections);
      }
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
      return id;
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ["collections"] });
      const previousCollections = queryClient.getQueryData<Collection[]>(["collections"]);

      queryClient.setQueryData<Collection[]>(["collections"], (old) =>
        old?.filter(col => col.id !== id)
      );

      return { previousCollections };
    },
    onError: (err, id, context) => {
      if (context?.previousCollections) {
        queryClient.setQueryData(["collections"], context.previousCollections);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["collections"] });
      queryClient.invalidateQueries({ queryKey: ["items"] });
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
