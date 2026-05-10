import { extractFeatures } from "./ml-features";
import { WishlistItem } from "./types";
import { supabase } from "./supabase";

const ML_URL = process.env.EXPO_PUBLIC_ML_URL!;

/**
 * Calls the ML microservice to get a personalised regret probability.
 *
 * Auth: the user's Supabase JWT is sent as a Bearer token. The ML service
 * verifies it server-side — no API secret is needed in the client bundle.
 */
export async function getMLRegretScore(
  item: WishlistItem,
  history: WishlistItem[]
): Promise<{ probability: number | null; topFactors: { feature: string; contribution: number }[] }> {
  const features = extractFeatures(item, history);

  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return { probability: null, topFactors: [] };

    const res = await fetch(`${ML_URL}/predict`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ features }),
    });

    if (!res.ok) return { probability: null, topFactors: [] };

    const data = await res.json();

    if (data.fallback === "v1_heuristic") {
      return { probability: null, topFactors: [] };
    }
    return { probability: data.regret_probability, topFactors: data.top_factors ?? [] };
  } catch {
    return { probability: null, topFactors: [] }; // graceful degradation
  }
}
