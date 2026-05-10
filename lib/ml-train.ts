import { WishlistItem } from "./types";
import { extractFeatures } from "./ml-features";
import { supabase } from "./supabase";

const ML_URL = process.env.EXPO_PUBLIC_ML_URL!;

/**
 * Triggers a model retrain for the current user.
 *
 * Auth: the user's Supabase JWT is sent as a Bearer token. The ML service
 * verifies it server-side and extracts the user_id from the token — the
 * client never needs to pass it explicitly.
 *
 * Rate limiting is enforced server-side (1 hour cooldown per user).
 */
export async function triggerModelTraining(items: WishlistItem[]) {
  // Only train on items with a definitive outcome — exclude "neutral" since
  // it maps to label 0 (same as "happy"), which would teach the model that
  // neutral purchases are fine. Neutral is ambiguous data, not a negative signal.
  const labeledItems = items.filter(
    (item) => item.outcome === "regretted" || item.outcome === "happy"
  );

  if (labeledItems.length < 10) {
    return { status: "not_enough_data" };
  }

  // Build training rows using the canonical extractFeatures function.
  // This ensures ignored_ratio_cat and all other features are computed
  // correctly — no manual reimplementation here.
  const trainingRows = labeledItems.map((item) => ({
    ...extractFeatures(item, labeledItems),
    label: item.outcome === "regretted" ? 1 : 0,
  }));

  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return { status: "error", message: "Not authenticated" };

    const res = await fetch(`${ML_URL}/train`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ training_rows: trainingRows }),
    });

    if (res.status === 429) {
      const data = await res.json();
      return { status: "rate_limited", ...data };
    }

    return await res.json();
  } catch {
    return { status: "error" };
  }
}
