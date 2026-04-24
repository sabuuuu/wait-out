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
      const previous = queryClient.getQueryData<Collection[]>(["collections"]);
      
      const optimistic = {
        ...newCol,
        id: Math.random().toString(36).substring(7),
        created_at: new Date().toISOString(),
      } as Collection;

      queryClient.setQueryData<Collection[]>(["collections"], (old) => [...(old || []), optimistic]);
      return { previous };
    },
    onError: (err, newCol, context) => {
      if (context?.previous) queryClient.setQueryData(["collections"], context.previous);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["collections"] }),
  });

  return {
    collections,
    isLoading,
    addCollection: addCollectionMutation.mutateAsync,
  };
}
