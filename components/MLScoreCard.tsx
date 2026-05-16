import React from "react";
import { View } from "react-native";
import { Text } from "@/components/ui/text";
import { RiskBadge } from "./ui/badge";
import { Sparkles, Info } from "lucide-react-native";

const FACTOR_LABELS: Record<string, string> = {
  hour_sin: "Late-night decision",
  hour_cos: "Late-night decision",
  price_vs_cat_avg: "Above category average",
  session_items_count: "Shopping spree mode",
  source_tiktok: "TikTok influence",
  source_instagram: "Instagram influence",
  ignored_ratio_cat: "High category neglect",
  cat_tech: "Tech impulse zone",
  cat_clothes: "Closet overflow risk",
  is_weekend: "Weekend spending mode",
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
    <View className="bg-white rounded-[32px] p-6 border border-[#282B4A]/[0.05] shadow-sm">
      <View className="flex-row items-center justify-between mb-4">
        <View className="flex-row items-center gap-2">
          <Sparkles size={16} color="#282B4A" opacity={0.6} />
          <Text className="font-bold text-[#282B4A] uppercase tracking-widest text-[10px]">Regret Forecast</Text>
        </View>
        <RiskBadge risk={risk} score={score} />
      </View>

      <View className="h-px w-full bg-[#282B4A]/[0.05] mb-4" />

      {isML && topFactors.length > 0 ? (
        <View className="gap-3">
          {topFactors.map((f) => (
            <View key={f.feature} className="flex-row items-center gap-2">
              <View className="w-1.5 h-1.5 rounded-full bg-[#282B4A]/20" />
              <Text className="text-sm text-[#282B4A]/70 font-medium">
                {FACTOR_LABELS[f.feature] ?? f.feature}
              </Text>
            </View>
          ))}
          <View className="flex-row items-center gap-1.5 mt-2 bg-[#282B4A]/[0.03] self-start px-3 py-1.5 rounded-full">
            <Info size={12} color="#282B4A" opacity={0.4} />
            <Text className="text-[10px] text-[#282B4A]/50 font-bold uppercase tracking-tight">
              {labeledCount < 30 ? "Learning your patterns" : "Personalised Model"}
            </Text>
          </View>
        </View>
      ) : (
        <View className="bg-[#282B4A]/[0.03] p-4 rounded-2xl">
          <Text className="text-xs text-[#282B4A]/50 leading-5 text-center font-medium">
            Add and rate 10+ items to unlock your personalised regret prediction model. ✨
          </Text>
        </View>
      )}
    </View>
  );
}
