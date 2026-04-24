import { WishlistItem, ScoreFactors } from "./types";

const HIGH_RISK_KEYWORDS = ["clothing", "beauty", "accessories", "shoes", "fashion"];
const MED_RISK_KEYWORDS  = ["home-decor", "tech", "fitness"];

export function computeRegretScore(
  item: Pick<WishlistItem, "added_hour" | "price" | "collection_id">,
  avgSpendForCollection: number,
  recentIgnoredInCollection: number,
  collectionName?: string
): { score: number; factors: ScoreFactors } {
  const hour = item.added_hour;
  const isLateNight = hour >= 22 || hour <= 3;
  const isEvening   = hour >= 19 && hour < 22;
  const timeOfDay   = isLateNight ? 30 : isEvening ? 18 : hour < 9 ? 10 : 0;

  const ratio      = avgSpendForCollection > 0 && item.price
    ? item.price / avgSpendForCollection : 1;
  const priceVsAvg = Math.min(30, Math.round(ratio * 15));

  const colLower    = collectionName?.toLowerCase() ?? "";
  const categoryRisk =
    HIGH_RISK_KEYWORDS.some((k) => colLower.includes(k)) ? 20 :
    MED_RISK_KEYWORDS.some((k) => colLower.includes(k))  ? 12 : 5;

  const historyIgnored = Math.min(20, recentIgnoredInCollection * 4);

  const score = Math.min(100, timeOfDay + priceVsAvg + categoryRisk + historyIgnored);
  return { score, factors: { timeOfDay, priceVsAvg, categoryRisk, historyIgnored } };
}

export function riskLevel(score: number): "low" | "mid" | "high" {
  if (score >= 60) return "high";
  if (score >= 35) return "mid";
  return "low";
}

export function factorLabels(f: ScoreFactors, addedHour: number): string[] {
  const labels: string[] = [];
  if (f.timeOfDay >= 18) labels.push(`Added at ${formatHour(addedHour)} 🌙`);
  if (f.priceVsAvg >= 20) labels.push("Way above your usual spend here");
  else if (f.priceVsAvg >= 12) labels.push("A bit above your avg for this collection");
  if (f.categoryRisk >= 20) labels.push("High-impulse category for you");
  if (f.historyIgnored >= 8) labels.push("You ignored similar items recently");
  return labels;
}

function formatHour(h: number) {
  const period = h >= 12 ? "pm" : "am";
  return `${h % 12 || 12}${period}`;
}
