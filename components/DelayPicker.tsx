import React from "react";
import { View, TouchableOpacity } from "react-native";
import { Text } from "@/components/ui/text";
import { DelayType } from "@/lib/types";

// "Custom" is intentionally excluded until a date picker is implemented.
// The DelayType union still includes "custom" for future use.
const OPTIONS: { label: string; value: DelayType; sub: string }[] = [
  { label: "3 Days",  value: "3d",     sub: "Quick check"  },
  { label: "7 Days",  value: "7d",     sub: "Cool off"     },
  { label: "2 Weeks", value: "2w",     sub: "Deep breath"  },
  { label: "Payday",  value: "payday", sub: "Budget check" },
];

interface Props {
  selected: DelayType;
  onChange: (v: DelayType) => void;
}

export function DelayPicker({ selected, onChange }: Props) {
  return (
    <View className="flex-row flex-wrap gap-2">
      {OPTIONS.map((opt) => {
        const isActive = selected === opt.value;
        return (
          <TouchableOpacity
            key={opt.value}
            onPress={() => onChange(opt.value)}
            activeOpacity={0.7}
            className={`flex-1 min-w-[100px] p-3 rounded-2xl border-2 ${
              isActive
                ? "bg-[#282B4A]/10 border-[#282B4A]"
                : "bg-[#282B4A]/[0.04] border-transparent"
            }`}
          >
            <Text className={`font-bold text-sm ${isActive ? "text-[#282B4A]" : "text-[#282B4A]/60"}`}>
              {opt.label}
            </Text>
            <Text className={`text-[10px] mt-0.5 ${isActive ? "text-[#282B4A]/70" : "text-[#282B4A]/40"}`}>
              {opt.sub}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}
