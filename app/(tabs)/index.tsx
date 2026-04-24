import React, { useMemo } from "react";
import { View, ScrollView, TouchableOpacity, Dimensions } from "react-native";
import { Text } from "@/components/ui/text";
import { Card, CardContent } from "@/components/ui/card";
import { useAppStore } from "@/lib/store";
import { LayoutDashboard, Wallet, Heart, ArrowRight, ShieldAlert, Timer, PlusCircle } from "lucide-react-native";
import { useRouter } from "expo-router";
import { useItems } from "@/hooks/useItems";

const { width } = Dimensions.get("window");

const WISDOM = [
  "Sleep on it. If you still want it in 3 days, it might be meant for you.",
  "Your future self will thank you for the money you're saving right now.",
  "Is this a 'need' or a 'right now'?",
  "You're in control of your spending. You're doing great!",
  "A little patience today is a lot of peace tomorrow.",
];

export default function Dashboard() {
  const { items } = useItems();
  const router = useRouter();

  const waitingItems = useMemo(() => items.filter(i => i.status === 'waiting'), [items]);
  
  const totalWaitingAmount = useMemo(() => {
    return waitingItems.reduce((acc, curr) => acc + (curr.price || 0), 0);
  }, [waitingItems]);

  const avgRegret = useMemo(() => {
    if (waitingItems.length === 0) return 0;
    return waitingItems.reduce((acc, curr) => acc + curr.regret_score, 0) / waitingItems.length;
  }, [waitingItems]);

  const riskLevel = useMemo(() => {
    if (avgRegret > 60) return { label: "High", color: "#ef4444" };
    if (avgRegret > 30) return { label: "Medium", color: "#f59e0b" };
    return { label: "Low", color: "#10b981" };
  }, [avgRegret]);

  const randomWisdom = useMemo(() => WISDOM[Math.floor(Math.random() * WISDOM.length)], []);

  return (
    <ScrollView className="flex-1 bg-background" contentContainerStyle={{ paddingBottom: 40 }}>
      {/* Header Summary */}
      <View className="bg-navy-500 pt-16 pb-12 px-6 rounded-b-[40px] shadow-lg shadow-navy-500/20">
        <View className="flex-row justify-between items-center mb-6">
          <View>
            <Text className="text-blush-100/70 text-sm font-medium uppercase tracking-wider">Total Waiting</Text>
            <Text className="text-blush-100 text-4xl font-display mt-1">€{totalWaitingAmount.toLocaleString()}</Text>
          </View>
          <View className="bg-blush-300 w-14 h-14 rounded-2xl items-center justify-center">
            <Wallet size={28} color="hsl(var(--primary))" />
          </View>
        </View>
        
        <View className="flex-row gap-4">
          <View className="flex-1 bg-white/10 rounded-2xl p-4 backdrop-blur-md">
            <Text className="text-blush-100/60 text-xs font-semibold uppercase">Items</Text>
            <Text className="text-blush-100 text-xl font-bold mt-1">{waitingItems.length}</Text>
          </View>
          <View className="flex-1 bg-white/10 rounded-2xl p-4 backdrop-blur-md">
            <Text className="text-blush-100/60 text-xs font-semibold uppercase">Impulse Risk</Text>
            <View className="flex-row items-center mt-1">
              <ShieldAlert size={16} color={riskLevel.color} className="mr-1" />
              <Text className="text-blush-100 text-xl font-bold">{riskLevel.label}</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Daily Wisdom */}
      <View className="px-6 -mt-6">
        <Card className="bg-blush-100 border-blush-200 shadow-sm">
          <CardContent className="p-5 flex-row items-center gap-4">
            <View className="bg-white rounded-full p-2">
              <Heart size={20} color="hsl(var(--primary))" />
            </View>
            <Text className="flex-1 text-navy-500 font-medium italic leading-5">
              "{randomWisdom}"
            </Text>
          </CardContent>
        </Card>
      </View>

      {/* Recent Items */}
      <View className="mt-8">
        <View className="flex-row justify-between items-center px-6 mb-4">
          <Text className="text-navy-500 text-xl font-display">Recently Added</Text>
          <TouchableOpacity onPress={() => router.push("/(tabs)/items")}>
            <View className="flex-row items-center gap-1">
              <Text className="text-primary text-sm font-semibold">View All</Text>
              <ArrowRight size={14} color="hsl(var(--primary))" />
            </View>
          </TouchableOpacity>
        </View>

        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingLeft: 24, paddingRight: 12 }}
        >
          {waitingItems.slice(0, 5).map((item) => (
            <TouchableOpacity 
              key={item.id} 
              onPress={() => router.push({ pathname: "/item/[id]", params: { id: item.id } })}
              activeOpacity={0.8}
            >
              <Card className="mr-3 w-48 overflow-hidden bg-card border-none shadow-sm">
                <View className="h-32 bg-muted items-center justify-center">
                  <Timer size={32} color="hsl(var(--muted-foreground))" />
                </View>
                <CardContent className="p-3">
                  <Text numberOfLines={1} className="text-navy-500 font-bold text-sm">{item.title}</Text>
                  <View className="flex-row justify-between items-center mt-2">
                    <Text className="text-primary font-bold">{item.currency}{item.price}</Text>
                    <View className="bg-blush-100 px-2 py-0.5 rounded-full">
                      <Text className="text-blush-600 text-[10px] font-bold uppercase">{item.delay_type}</Text>
                    </View>
                  </View>
                </CardContent>
              </Card>
            </TouchableOpacity>
          ))}
          
          <TouchableOpacity 
            onPress={() => router.push("/(tabs)/add")}
            className="w-40 mr-3 border-2 border-dashed border-blush-300 rounded-3xl items-center justify-center"
          >
            <PlusCircle size={32} color="hsl(var(--primary))" />
            <Text className="text-primary font-bold mt-2">Add New</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Stats / Motivation */}
      <View className="px-6 mt-8">
        <Card className="bg-navy-600 border-none p-6">
          <Text className="text-blush-100/60 text-sm font-semibold uppercase mb-2">Savings Potential</Text>
          <Text className="text-white text-lg font-medium leading-6">
            If you decided not to buy these today, you'd have <Text className="text-blush-300 font-bold">€{totalWaitingAmount}</Text> back in your pocket. 🥂
          </Text>
          <TouchableOpacity className="bg-blush-300 py-3 rounded-2xl mt-6 items-center">
            <Text className="text-navy-500 font-bold">Review My List</Text>
          </TouchableOpacity>
        </Card>
      </View>
    </ScrollView>
  );
}

