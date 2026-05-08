import React, { useEffect, useState } from "react";
import { View } from "react-native";
import { Text } from "./ui/text";
import { WifiOff } from "lucide-react-native";
import NetInfo from "@react-native-community/netinfo";
import Animated, { FadeInDown, FadeOutDown } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export function OfflineBanner() {
  const [isConnected, setIsConnected] = useState<boolean | null>(true);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsConnected(state.isConnected);
    });
    return () => unsubscribe();
  }, []);

  if (isConnected !== false) return null;

  return (
    <Animated.View 
      entering={FadeInDown.springify()} 
      exiting={FadeOutDown}
      className="absolute w-full px-6 z-50"
      style={{ bottom: Math.max(insets.bottom, 20) + 70 }}
    >
      <View className="bg-destructive/90 rounded-2xl p-4 flex-row items-center shadow-lg border border-destructive">
        <WifiOff size={20} color="white" />
        <View className="ml-3 flex-1">
          <Text className="text-white font-bold text-sm">You're offline</Text>
          <Text className="text-white/80 text-[11px] font-medium mt-0.5">Some changes may not be saved.</Text>
        </View>
      </View>
    </Animated.View>
  );
}
