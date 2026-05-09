import { extractFeatures } from "./ml-features";
import { WishlistItem } from "./types";

const ML_URL    = process.env.EXPO_PUBLIC_ML_URL!;
const ML_SECRET = process.env.EXPO_PUBLIC_ML_SECRET!;

export async function getMLRegretScore(
  item: WishlistItem,
  history: WishlistItem[]
): Promise<{ probability: number | null; topFactors: { feature: string; contribution: number }[] }> {
  const features = extractFeatures(item, history);

  try {
    const res = await fetch(`${ML_URL}/predict`, {
      method:  "POST",
      headers: { "Content-Type": "application/json", "x-api-key": ML_SECRET },
      body:    JSON.stringify({ user_id: item.user_id, features }),
    });
    const data = await res.json();

    if (data.fallback === "v1_heuristic") {
      return { probability: null, topFactors: [] };
    }
    return { probability: data.regret_probability, topFactors: data.top_factors };
  } catch {
    return { probability: null, topFactors: [] }; // graceful degradation
  }
}
