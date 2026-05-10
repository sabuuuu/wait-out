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
      // getSession() reads from local storage — no network round-trip.
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return null;

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", session.user.id)
        .single();

      if (error) {
        // Profile doesn't exist yet — create it on first sign-in
        if (error.code === "PGRST116") {
          const { data: newProfile, error: createError } = await supabase
            .from("profiles")
            .insert({
              id: session.user.id,
              display_name: session.user.user_metadata?.full_name || "Pausy User",
              currency: "DZD",
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
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return null;

      const { data, error } = await supabase
        .from("notification_prefs")
        .select("*")
        .eq("user_id", session.user.id)
        .single();

      if (error) {
        if (error.code === "PGRST116") {
          const { data: newPrefs, error: createError } = await supabase
            .from("notification_prefs")
            .insert({ user_id: session.user.id })
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
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("profiles")
        .update(updated)
        .eq("id", session.user.id)
        .select()
        .single();

      if (error) throw error;
      return data as Profile;
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["profile"] }),
  });

  const updatePrefsMutation = useMutation({
    mutationFn: async (updated: Partial<NotificationPrefs>) => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("notification_prefs")
        .update(updated)
        .eq("user_id", session.user.id)
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
