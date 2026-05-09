import { WishlistItem } from "./types";

const ML_URL = process.env.EXPO_PUBLIC_ML_URL!;
const ML_SECRET = process.env.EXPO_PUBLIC_ML_SECRET!;

export async function triggerModelTraining(user_id: string, items: WishlistItem[]) {
  const labeledItems = items.filter((item) => item.outcome !== null && item.outcome !== undefined);

  if (labeledItems.length < 10) {
    return { status: "not_enough_data" };
  }

  const trainingRows = labeledItems.map((item) => ({
    hour_sin: item.added_hour ? Math.sin((2 * Math.PI * item.added_hour) / 24) : 0,
    hour_cos: item.added_hour ? Math.cos((2 * Math.PI * item.added_hour) / 24) : 0,
    day_of_week: item.added_day_of_week ?? new Date().getDay(),
    is_weekend: [0, 6].includes(item.added_day_of_week ?? new Date().getDay()) ? 1 : 0,
    price_log: Math.log1p(item.price ?? 0),
    price_vs_cat_avg: item.price_vs_cat_avg ?? 1,
    session_items_count: item.session_items_count ?? 1,
    source_tiktok: item.source_platform === "tiktok" ? 1 : 0,
    source_instagram: item.source_platform === "instagram" ? 1 : 0,
    source_web: item.source_platform === "web" ? 1 : 0,
    cat_clothes: item.category_slug === "clothes" ? 1 : 0,
    cat_tech: item.category_slug === "tech" ? 1 : 0,
    cat_beauty: item.category_slug === "beauty" ? 1 : 0,
    cat_home: item.category_slug === "home" ? 1 : 0,
    cat_other: !item.category_slug || item.category_slug === "other" ? 1 : 0,
    ignored_ratio_cat: 0.5,
    label: item.outcome === "regretted" ? 1 : 0,
  }));

  try {
    const res = await fetch(`${ML_URL}/train`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-key": ML_SECRET },
      body: JSON.stringify({ user_id, training_rows: trainingRows }),
    });

    return await res.json();
  } catch (error) {
    console.error("Failed to trigger ML training:", error);
    return { status: "error", error };
  }
}
