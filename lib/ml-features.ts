import { WishlistItem } from "./types";

export interface MLFeatures {
  hour_sin:            number;   // sin(2π * hour/24) — cyclic encoding
  hour_cos:            number;   // cos(2π * hour/24)
  day_of_week:         number;   // 0–6
  is_weekend:          number;   // 0 | 1
  price_log:           number;   // log1p(price) — handles $5 vs $500 items
  price_vs_cat_avg:    number;   // 1.0 = at average; 2.0 = twice average
  session_items_count: number;   // binge-adding signal
  source_tiktok:       number;   // one-hot
  source_instagram:    number;
  source_web:          number;
  cat_clothes:         number;   // one-hot category
  cat_tech:            number;
  cat_beauty:          number;
  cat_home:            number;
  cat_other:           number;
  ignored_ratio_cat:   number;   // % of past items in this category the user ignored
}

export function extractFeatures(item: WishlistItem, history: WishlistItem[]): MLFeatures {
  const hour  = item.added_hour;
  const price = item.price ?? 0;

  const hour_sin = Math.sin((2 * Math.PI * hour) / 24);
  const hour_cos = Math.cos((2 * Math.PI * hour) / 24);

  const catItems    = history.filter((h) => h.category_slug === item.category_slug && h.price);
  const catAvgPrice = catItems.length
    ? catItems.reduce((s, h) => s + (h.price ?? 0), 0) / catItems.length
    : price;
  const price_vs_cat_avg = catAvgPrice > 0 ? price / catAvgPrice : 1;

  const catResolved       = catItems.filter((h) => h.outcome === "regretted" || h.outcome === "happy");
  const ignored_ratio_cat = catResolved.length
    ? catResolved.filter((h) => h.outcome === "regretted").length / catResolved.length
    : 0.5;

  const dayOfWeek = item.added_day_of_week ?? new Date().getDay();
  const sessionCount = item.session_items_count ?? 1;

  return {
    hour_sin, hour_cos,
    day_of_week:      dayOfWeek,
    is_weekend:       [0, 6].includes(dayOfWeek) ? 1 : 0,
    price_log:        Math.log1p(price),
    price_vs_cat_avg,
    session_items_count: sessionCount,
    source_tiktok:    item.source_platform === "tiktok"    ? 1 : 0,
    source_instagram: item.source_platform === "instagram" ? 1 : 0,
    source_web:       item.source_platform === "web"       ? 1 : 0,
    cat_clothes:      item.category_slug === "clothes"     ? 1 : 0,
    cat_tech:         item.category_slug === "tech"        ? 1 : 0,
    cat_beauty:       item.category_slug === "beauty"      ? 1 : 0,
    cat_home:         item.category_slug === "home"        ? 1 : 0,
    cat_other:        !item.category_slug || item.category_slug === "other" ? 1 : 0,
    ignored_ratio_cat,
  };
}
