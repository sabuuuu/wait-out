import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { NotificationPrefs } from "@/lib/types";

export interface Profile {
  id: string;
  display_name: string | null;
  currency: string;
  payday_day: number | null;
  created_at: string;
}

export function useProfile() {
  const queryClient = useQueryClient();

  const { data: profile, isLoading: isProfileLoading } = useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (error) {
        // If profile doesn't exist, create it
        if (error.code === "PGRST116") {
          const { data: newProfile, error: createError } = await supabase
            .from("profiles")
            .insert({ 
              id: user.id, 
              display_name: user.user_metadata?.full_name || "Wait Out User",
              currency: "DZD"
            })
            .select()
            .single();
          
          if (createError) throw createError;
          return newProfile as Profile;
        }
        throw error;
      }
      return data as Profile;
    },
  });

  const { data: prefs, isLoading: isPrefsLoading } = useQuery({
    queryKey: ["notification_prefs"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from("notification_prefs")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (error) {
        if (error.code === "PGRST116") {
          const { data: newPrefs, error: createError } = await supabase
            .from("notification_prefs")
            .insert({ user_id: user.id })
            .select()
            .single();
          if (createError) throw createError;
          return newPrefs as NotificationPrefs;
        }
        throw error;
      }
      return data as NotificationPrefs;
    },
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (updated: Partial<Profile>) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("profiles")
        .update(updated)
        .eq("id", user.id)
        .select()
        .single();

      if (error) throw error;
      return data as Profile;
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["profile"] }),
  });

  const updatePrefsMutation = useMutation({
    mutationFn: async (updated: Partial<NotificationPrefs>) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("notification_prefs")
        .update(updated)
        .eq("user_id", user.id)
        .select()
        .single();

      if (error) throw error;
      return data as NotificationPrefs;
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["notification_prefs"] }),
  });

  return {
    profile,
    prefs,
    isLoading: isProfileLoading || isPrefsLoading,
    updateProfile: updateProfileMutation.mutateAsync,
    updatePrefs: updatePrefsMutation.mutateAsync,
    isUpdatingProfile: updateProfileMutation.isPending,
    isUpdatingPrefs: updatePrefsMutation.isPending,
  };
}
