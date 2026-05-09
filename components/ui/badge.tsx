import React from "react";
import { View } from "react-native";
import { Text } from "./text";

type Risk = "high" | "mid" | "low";

const riskMap: Record<Risk, { container: string; label: string }> = {
  high: { container: "bg-red-50 border-red-200",     label: "text-red-800" },
  mid:  { container: "bg-amber-50 border-amber-200", label: "text-amber-800" },
  low:  { container: "bg-green-50 border-green-200", label: "text-green-800" },
};

export function RiskBadge({ risk, score }: { risk: string; score: number }) {
  const mappedRisk = risk as Risk;
  const config = riskMap[mappedRisk] || riskMap.low;
  
  return (
    <View className={`rounded-full px-3 py-1 border ${config.container}`}>
      <Text className={`text-[10px] font-bold uppercase tracking-wider ${config.label}`}>
        {score}% regret
      </Text>
    </View>
  );
}
