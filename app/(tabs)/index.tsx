import React from "react";
import { View } from "react-native";
import { Text } from "@/components/ui/text";

export default function Dashboard() {
  return (
    <View className="flex-1 items-center justify-center bg-background">
      <Text className="text-2xl font-bold">Dashboard</Text>
    </View>
  );
}
