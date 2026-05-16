import React, { useMemo, useState } from "react";
import { View, ScrollView, TouchableOpacity, Share, Linking } from "react-native";
import { useLocalSearchParams, Stack, useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { useItems } from "@/hooks/useItems";
import { useAppStore } from "@/lib/store";
import { Text } from "@/components/ui/text";
import { OutcomePrompt } from "@/components/OutcomePrompt";
import { MLScoreCard } from "@/components/MLScoreCard";
import { MLTopFactor } from "@/lib/types";
import {
  Timer,
  ShoppingBag,
  Ghost,
  Trash2,
  ExternalLink,
  Clock,
  Share2,
  ChevronLeft,
} from "lucide-react-native";

const PALETTE = "#282B4A";
const PARCHMENT = "#EEEBDA";

export default function ItemDetail() {
  const { id } = useLocalSearchParams();
  const { items, updateItem, deleteItem } = useItems();
  const { showAlert } = useAppStore();
  const router = useRouter();
  const [showOutcome, setShowOutcome] = useState(false);

  const item = useMemo(() => items.find((i) => i.id === id), [items, id]);
  const labeledCount = useMemo(
    () => items.filter(i => i.outcome != null).length,
    [items]
  );

  if (!item) {
    return (
      <View className="flex-1 items-center justify-center bg-[#EEEBDA]">
        <Text className="text-[#282B4A]/60 font-medium">Item not found</Text>
        <TouchableOpacity
          onPress={() => router.back()}
          className="mt-4 px-6 py-3 bg-[#282B4A] rounded-2xl"
        >
          <Text className="text-[#EEEBDA] font-bold">Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleDecision = async (status: "bought" | "forgot") => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      await updateItem({ id: item.id, status });
      setShowOutcome(true);
    } catch (e: any) {
      showAlert("Error", e?.message ?? "Could not update item.", "error");
    }
  };

  const handleDelete = async () => {
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      await deleteItem(item.id);
      router.back();
    } catch (e: any) {
      showAlert("Error", e?.message ?? "Could not delete item.", "error");
    }
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `I'm waiting out this purchase: ${item.title} (${item.currency}${item.price}). Patience is a virtue! 🎀`,
        url: item.source_url,
      });
    } catch {
      // Share sheet dismissed — not an error worth surfacing
    }
  };

  const openLink = (url?: string) => {
    if (url) Linking.openURL(url);
  };

  // Compute actual elapsed progress (0–1) from added_at → remind_at
  const now = Date.now();
  const addedMs  = new Date(item.added_at).getTime();
  const remindMs = new Date(item.remind_at).getTime();
  const elapsed  = remindMs > addedMs
    ? Math.min(1, (now - addedMs) / (remindMs - addedMs))
    : 1;
  const isExpired = elapsed >= 1;

  // Determine whether score_factors holds ML top-factors or V1 ScoreFactors
  const mlTopFactors = Array.isArray(item.score_factors)
    ? (item.score_factors as MLTopFactor[])
    : [];
  const hasMLScore = mlTopFactors.length > 0;

  const statusColor = {
    waiting: PALETTE,
    bought:  "#10b981",
    forgot:  `${PALETTE}60`,
    snoozed: `${PALETTE}60`,
  }[item.status] ?? PALETTE;

  return (
    <ScrollView className="flex-1 bg-[#EEEBDA]">
      <Stack.Screen
        options={{
          headerTitle: "",
          headerStyle: { backgroundColor: PARCHMENT },
          headerShadowVisible: false,
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()} className="p-2 -ml-2">
              <ChevronLeft size={28} color={PALETTE} />
            </TouchableOpacity>
          ),
          headerRight: () => (
            <TouchableOpacity onPress={handleShare} className="p-2 -mr-2">
              <Share2 size={24} color={PALETTE} />
            </TouchableOpacity>
          ),
        }}
      />

      <View className="px-6 pt-4 pb-10">
        {/* Visual Indicator */}
        <View className="items-center mb-10">
          <View className="w-32 h-32 bg-white rounded-[48px] items-center justify-center shadow-sm border border-[#282B4A]/[0.03]">
            {item.status === "waiting"  && <Timer       size={64} color={PALETTE} opacity={0.7} />}
            {item.status === "bought"   && <ShoppingBag size={64} color="#10b981" />}
            {item.status === "forgot"   && <Ghost       size={64} color={`${PALETTE}30`} />}
          </View>
          
          {/* Prominent Status Badge */}
          <View 
            className="mt-6 px-6 py-2.5 rounded-2xl shadow-sm" 
            style={{ backgroundColor: statusColor === PALETTE ? PALETTE : statusColor }}
          >
            <Text className="text-[#EEEBDA] font-outfit-bold text-[10px] uppercase tracking-[2px]">
              {item.status === 'waiting' ? 'Waiting Period' : item.status}
            </Text>
          </View>
        </View>

        {/* Title + Price */}
        <View className="items-center mb-10 px-4">
          <Text className="text-3xl font-fancy text-[#282B4A] text-center leading-[38px]">{item.title}</Text>
          <View className="flex-row items-baseline mt-4 bg-[#282B4A]/[0.04] px-5 py-2 rounded-2xl">
            <Text className="text-[#282B4A] text-3xl font-bold">
              {item.price?.toLocaleString()}
            </Text>
            <Text className="text-lg text-[#282B4A]/60 font-medium ml-1.5">{item.currency}</Text>
          </View>
        </View>

        {/* ML Score Card */}
        <View className="mb-6">
          <MLScoreCard
            probability={hasMLScore ? item.regret_score / 100 : null}
            topFactors={mlTopFactors}
            fallbackScore={item.regret_score}
            labeledCount={labeledCount}
          />
        </View>

        {/* Progress Card */}
        <View className="bg-white rounded-[28px] p-5 border border-[#282B4A]/[0.05] shadow-sm mb-6">
          <View className="flex-row items-center justify-between mb-3">
            <View className="flex-row items-center gap-2">
              <Clock size={16} color={PALETTE} opacity={0.5} />
              <Text className="text-[#282B4A]/50 font-bold text-xs uppercase tracking-wide">
                Time Left
              </Text>
            </View>
            <Text className="text-[#282B4A] font-bold text-sm">
              {isExpired ? "Time to decide!" : "Waiting..."}
            </Text>
          </View>
          <View className="h-2 bg-[#282B4A]/[0.06] rounded-full overflow-hidden">
            <View
              className="h-full bg-[#282B4A] rounded-full"
              style={{ width: `${Math.round(elapsed * 100)}%` }}
            />
          </View>
          <Text className="text-[#282B4A]/40 text-xs mt-3">
            Added: {new Date(item.added_at).toLocaleDateString()} ·{" "}
            Ends: {new Date(item.remind_at).toLocaleDateString()}
          </Text>
        </View>

        {/* Notes */}
        {item.notes && (
          <View className="mb-6">
            <Text className="text-[10px] text-[#282B4A]/40 font-bold uppercase tracking-widest mb-2 ml-1">
              Your Thoughts
            </Text>
            <Text className="text-[#282B4A]/70 italic leading-5">"{item.notes}"</Text>
          </View>
        )}

        {/* Links */}
        {(item.source_url || item.tiktok_url || item.instagram_url) && (
          <View className="mb-8">
            <Text className="text-[10px] text-[#282B4A]/40 font-bold uppercase tracking-widest mb-3 ml-1">
              Sources
            </Text>
            <View className="flex-row flex-wrap gap-2">
              {item.source_url && (
                <TouchableOpacity
                  onPress={() => openLink(item.source_url)}
                  className="flex-row items-center gap-2 bg-[#282B4A]/[0.06] px-4 py-2.5 rounded-xl"
                >
                  <ExternalLink size={14} color={PALETTE} opacity={0.6} />
                  <Text className="text-[#282B4A] font-bold text-xs">Website</Text>
                </TouchableOpacity>
              )}
              {item.tiktok_url && (
                <TouchableOpacity
                  onPress={() => openLink(item.tiktok_url)}
                  className="flex-row items-center gap-2 bg-[#282B4A]/[0.06] px-4 py-2.5 rounded-xl"
                >
                  <ExternalLink size={14} color={PALETTE} opacity={0.6} />
                  <Text className="text-[#282B4A] font-bold text-xs">TikTok</Text>
                </TouchableOpacity>
              )}
              {item.instagram_url && (
                <TouchableOpacity
                  onPress={() => openLink(item.instagram_url)}
                  className="flex-row items-center gap-2 bg-[#282B4A]/[0.06] px-4 py-2.5 rounded-xl"
                >
                  <ExternalLink size={14} color={PALETTE} opacity={0.6} />
                  <Text className="text-[#282B4A] font-bold text-xs">Instagram</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}

        {/* Decision Buttons */}
        <View className="gap-3 mt-4">
          <TouchableOpacity
            onPress={() => handleDecision("bought")}
            className="h-14 rounded-2xl border-2 border-[#282B4A]/20 flex-row items-center justify-center gap-3 bg-white"
            activeOpacity={0.8}
          >
            <ShoppingBag size={20} color={PALETTE} />
            <Text className="text-[#282B4A] font-bold text-base">I bought it</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => handleDecision("forgot")}
            className="h-14 rounded-2xl flex-row items-center justify-center gap-3 bg-[#282B4A]"
            activeOpacity={0.8}
          >
            <Ghost size={20} color={PARCHMENT} />
            <Text className="text-[#EEEBDA] font-bold text-base">I forgot about it! 🥂</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={handleDelete} className="items-center mt-6" activeOpacity={0.7}>
            <View className="flex-row items-center gap-2">
              <Trash2 size={16} color="#ef4444" />
              <Text className="text-[#ef4444] font-bold">Remove Item</Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>

      {showOutcome && (
        <OutcomePrompt
          item={item}
          onDone={() => {
            setShowOutcome(false);
            router.back();
          }}
        />
      )}
    </ScrollView>
  );
}
