import React from "react";
import { View } from "react-native";
import { Text } from "@/components/ui/text";
import { Card } from "@/components/ui/card";
import { RiskBadge } from "./ui/badge";


const FACTOR_LABELS: Record<string, string> = {
  hour_sin: "🌙 Late-night vibes",
  hour_cos: "🌙 Late-night vibes",
  price_vs_cat_avg: "💸 Pricier than your usual",
  session_items_count: "🛒 On a shopping spree",
  source_tiktok: "📱 TikTok made you do it",
  source_instagram: "📱 Instagram made you do it",
  ignored_ratio_cat: "🪦 You usually forget these",
  cat_tech: "🖥️ Tech = danger zone for you",
  cat_clothes: "👗 You own enough clothes",
  is_weekend: "📅 Weekend treat mode",
};

export function MLScoreCard({
  probability,
  topFactors,
  fallbackScore,
  labeledCount,
}: {
  probability: number | null;
  topFactors: { feature: string; contribution: number }[];
  fallbackScore: number;
  labeledCount: number;
}) {
  const score = probability !== null ? Math.round(probability * 100) : fallbackScore;
  const risk = score >= 65 ? "high" : score >= 35 ? "mid" : "low";
  const isML = probability !== null;

  return (
    <Card className="bg-[#282B4A]/5 border-[#282B4A]/10">
      <View className="flex-row items-center justify-between mb-3">
        <Text className="font-semibold text-[#282B4A] uppercase tracking-wide text-xs">Regret forecast</Text>
        <View className="flex-row items-center gap-2">
          {isML && labeledCount < 30 && <Text className="text-xs text-[#282B4A]/60">✨ learning your patterns</Text>}
          {isML && labeledCount >= 30 && <Text className="text-xs text-[#282B4A]/60">✨ personalised</Text>}
          <RiskBadge risk={risk} score={score} />
        </View>
      </View>

      {isML && topFactors.length > 0 && (
        <View className="gap-1 mt-2">
          <Text className="text-xs text-[#282B4A]/60 font-semibold uppercase tracking-wide mb-1">
            Why we think so
          </Text>
          {topFactors.map((f) => (
            <Text key={f.feature} className="text-sm text-[#282B4A]/80 flex-row items-center before:content-['•'] before:mr-2">
              • {FACTOR_LABELS[f.feature] ?? f.feature}
            </Text>
          ))}
        </View>
      )}

      {!isML && (
        <Text className="text-xs text-[#282B4A]/60 mt-1">
          Add 10+ items and rate them to unlock your personalised model ✨
        </Text>
      )}
    </Card>
  );
}
