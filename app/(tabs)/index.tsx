import React, { useMemo, useState, useEffect } from "react";
import { View, ScrollView, TouchableOpacity } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Text } from "@/components/ui/text";
import { ArrowRight, Timer, PlusCircle, ShieldAlert, Sparkles } from "lucide-react-native";
import { useRouter } from "expo-router";
import { useItems } from "@/hooks/useItems";
import { useProfile } from "@/hooks/useProfile";
import { supabase } from "@/lib/supabase";

const WISDOM = [
  "Sleep on it. If you still want it in 3 days, it might be meant for you.",
  "Your future self will thank you for the money you're saving right now.",
  "Is this a 'need' or a 'right now'?",
  "You're in control of your spending. You're doing great!",
  "A little patience today is a lot of peace tomorrow.",
];

export default function Dashboard() {
  const insets = useSafeAreaInsets();
  const { items } = useItems();
  const { profile } = useProfile();
  const router = useRouter();

  const firstName = useMemo(() => {
    const name = profile?.display_name ?? "";
    return name.split(" ")[0] || "there";
  }, [profile]);

  const waitingItems = useMemo(() => items.filter(i => i.status === 'waiting'), [items]);

  const totalWaitingAmount = useMemo(() => {
    return waitingItems.reduce((acc, curr) => acc + (curr.price || 0), 0);
  }, [waitingItems]);

  const avgRegret = useMemo(() => {
    if (waitingItems.length === 0) return 0;
    return waitingItems.reduce((acc, curr) => acc + curr.regret_score, 0) / waitingItems.length;
  }, [waitingItems]);

  const riskLevel = useMemo(() => {
    if (avgRegret > 60) return { label: "High Risk", color: "#ef4444" };
    if (avgRegret > 30) return { label: "Medium Risk", color: "#f59e0b" };
    return { label: "Low Risk", color: "#10b981" };
  }, [avgRegret]);

  const randomWisdom = useMemo(() => WISDOM[Math.floor(Math.random() * WISDOM.length)], []);

  return (
    <ScrollView
      className="flex-1 bg-[#EEEBDA]"
      contentContainerStyle={{
        paddingTop: Math.max(insets.top, 20),
        paddingBottom: Math.max(insets.bottom, 20) + 60
      }}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View className="px-6 pt-10 pb-2">
        <Text className="text-[11px] text-[#282B4A]/50 font-bold uppercase tracking-widest mb-2">Overview</Text>
        <Text className="text-4xl font-fancy text-[#282B4A]">Hi, {firstName}.</Text>
      </View>

      {/* Hero Stat - Total Waiting */}
      <View className="px-6 mt-6">
        <View className="bg-[#282B4A] rounded-[32px] p-7 shadow-sm">
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-[11px] text-[#EEEBDA]/70 font-semibold uppercase tracking-widest">Total Waiting</Text>
            <Sparkles size={16} color="#EEEBDA" opacity={0.5} />
          </View>
          <Text className="text-[#EEEBDA] text-4xl font-bold tracking-tight">
            {totalWaitingAmount.toLocaleString()} <Text className="text-2xl text-[#EEEBDA]/60 font-medium">DZD</Text>
          </Text>
        </View>
      </View>

      {/* Secondary Stats */}
      <View className="flex-row px-6 mt-4 gap-4">
        {/* Items */}
        <View className="flex-1 bg-white rounded-3xl p-5 border border-[#282B4A]/[0.03]">
          <Text className="text-[10px] text-[#282B4A]/40 font-bold uppercase tracking-wider mb-2">Items</Text>
          <Text className="text-[#282B4A] text-2xl font-bold">{waitingItems.length}</Text>
        </View>

        {/* Risk */}
        <View className="flex-1 bg-white rounded-3xl p-5 border border-[#282B4A]/[0.03]">
          <Text className="text-[10px] text-[#282B4A]/40 font-bold uppercase tracking-wider mb-2">Impulse Level</Text>
          <View className="flex-row items-center gap-1.5 mt-1">
            <ShieldAlert size={16} color={riskLevel.color} />
            <Text className="text-[#282B4A] text-base font-bold">{riskLevel.label}</Text>
          </View>
        </View>
      </View>

      {/* Elegant Daily Wisdom */}
      <View className="px-10 mt-10 mb-2">
        <Text className="text-[14px] text-[#282B4A]/50 italic font-serif leading-6 text-center">
          "{randomWisdom}"
        </Text>
      </View>

      {/* Recently Added Section */}
      <View className="mt-10">
        <View className="flex-row justify-between items-end px-6 mb-5">
          <Text className="text-[#282B4A] text-xl font-bold">Waiting Room</Text>
          <TouchableOpacity onPress={() => router.push("/(tabs)/items")} activeOpacity={0.6}>
            <View className="flex-row items-center gap-1 pb-1">
              <Text className="text-[#282B4A]/50 text-[12px] font-bold uppercase tracking-wider">View All</Text>
              <ArrowRight size={14} color="rgba(40,43,74,0.5)" />
            </View>
          </TouchableOpacity>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingLeft: 24, paddingRight: 12 }}
        >
          {/* Add New Button */}
          <TouchableOpacity
            onPress={() => router.push("/(tabs)/add")}
            activeOpacity={0.8}
            className="mr-4 w-32 h-32 rounded-[28px] items-center justify-center"
            style={{ backgroundColor: '#282B4A' }}
          >
            <View
              className="w-11 h-11 rounded-full items-center justify-center mb-3"
              style={{ backgroundColor: 'rgba(238,235,218,0.15)' }}
            >
              <PlusCircle size={20} color="#EEEBDA" />
            </View>
            <Text className="text-[13px] font-semibold" style={{ color: '#EEEBDA' }}>Add item</Text>
            <Text className="text-[10px] mt-1" style={{ color: 'rgba(238,235,218,0.45)' }}>Resist the urge</Text>
          </TouchableOpacity>

          {/* Item Cards */}
          {waitingItems.slice(0, 5).map((item) => (
            <TouchableOpacity
              key={item.id}
              onPress={() => router.push({ pathname: "/item/[id]", params: { id: item.id } })}
              activeOpacity={0.9}
            >
              <View className="mr-4 w-40 h-48 bg-white rounded-[28px] p-5 justify-between border border-[#282B4A]/[0.03] shadow-sm">
                <View>
                  <View className="w-10 h-10 rounded-full bg-[#282B4A]/5 items-center justify-center mb-3">
                    <Timer size={18} color="rgba(40,43,74,0.6)" />
                  </View>
                  <Text numberOfLines={2} className="text-[#282B4A] font-bold text-sm leading-5">
                    {item.title}
                  </Text>
                </View>

                <View>
                  <Text className="text-[#282B4A]/50 text-[10px] font-bold uppercase tracking-wider mb-1">
                    {item.delay_type}
                  </Text>
                  <Text className="text-[#282B4A] font-bold text-[15px]">
                    {item.price?.toLocaleString()} <Text className="text-[11px] text-[#282B4A]/60">{item.currency}</Text>
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Elegant Savings Card */}
      <View className="px-6 mt-6">
        <View className="bg-white rounded-[40px] p-8 border border-[#282B4A]/[0.04] shadow-sm items-center">
          <Text className="text-[#282B4A] text-2xl font-fancy mb-3 text-center">
            The Silver Lining
          </Text>
          <Text className="text-[#282B4A]/60 text-[14px] font-medium leading-6 text-center px-4 mb-6">
            If you walked away from these today, you'd keep{" "}
            <Text className="text-[#282B4A] font-bold">{totalWaitingAmount.toLocaleString()} DZD</Text>.
          </Text>

          <TouchableOpacity
            className="bg-[#282B4A] py-4 px-6 rounded-2xl items-center justify-center mt-2"
            onPress={() => router.push("/(tabs)/items")}
            activeOpacity={0.85}
          >
            <Text className="text-[#EEEBDA] font-bold text-[14px] tracking-wide">Review my list</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}