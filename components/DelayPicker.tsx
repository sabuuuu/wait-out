import React from "react";
import { View, TouchableOpacity, ScrollView } from "react-native";
import { Text } from "@/components/ui/text";
import { DelayType } from "@/lib/types";

const OPTIONS: { label: string; value: DelayType; sub: string }[] = [
  { label: "3 Days", value: "3d", sub: "Quick check" },
  { label: "7 Days", value: "7d", sub: "Cool off" },
  { label: "2 Weeks", value: "2w", sub: "Deep breath" },
  { label: "Payday", value: "payday", sub: "Budget check" },
  { label: "Custom", value: "custom", sub: "Your rules" },
];

interface Props {
  selected: DelayType;
  onChange: (v: DelayType) => void;
}

export function DelayPicker({ selected, onChange }: Props) {
  return (
    <View className="flex-row flex-wrap gap-2">
      {OPTIONS.map((opt) => (
        <TouchableOpacity
          key={opt.value}
          onPress={() => onChange(opt.value)}
          className={`flex-1 min-w-[100px] p-3 rounded-2xl border-2 ${
            selected === opt.value 
              ? "bg-blush-100 border-primary" 
              : "bg-muted border-transparent"
          }`}
        >
          <Text className={`font-bold text-sm ${selected === opt.value ? "text-primary" : "text-navy-500"}`}>
            {opt.label}
          </Text>
          <Text className={`text-[10px] mt-0.5 ${selected === opt.value ? "text-primary/70" : "text-muted-foreground"}`}>
            {opt.sub}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}
