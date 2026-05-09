import React, { useState } from "react";
import { View, TouchableOpacity, Modal } from "react-native";
import { Text } from "./ui/text";
import { Card } from "./ui/card";
import { WishlistItem } from "@/lib/types";
import { supabase } from "@/lib/supabase";
import { useItems } from "@/hooks/useItems";
import { useML } from "@/hooks/useML";
import * as Haptics from "expo-haptics";
import Animated, { FadeIn, FadeOut, SlideInDown, SlideOutDown } from "react-native-reanimated";

export function OutcomePrompt({ item, onDone }: { item: WishlistItem; onDone: () => void }) {
  const [saving, setSaving] = useState(false);
  const { items } = useItems();
  const { triggerTraining } = useML();

  async function record(outcome: "regretted" | "happy" | "neutral") {
    setSaving(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      await supabase
        .from("items")
        .update({ outcome, outcome_set_at: new Date().toISOString() })
        .eq("id", item.id);

      // Trigger training natively via TanStack Query
      const updatedItems = items.map(i => i.id === item.id ? { ...i, outcome } : i) as WishlistItem[];
      triggerTraining({ userId: item.user_id, items: updatedItems });
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
      onDone();
    }
  }

  return (
    <Modal transparent animationType="none" visible={true} onRequestClose={onDone}>
      <Animated.View 
        entering={FadeIn} 
        exiting={FadeOut}
        className="flex-1 bg-black/40 justify-end"
      >
        <Animated.View 
          entering={SlideInDown.springify()} 
          exiting={SlideOutDown}
          className="bg-[#EEEBDA] rounded-t-[40px] p-8 pb-12 shadow-2xl"
        >
          <Text className="text-2xl font-fancy text-[#282B4A] text-center mb-2">
            How do you feel?
          </Text>
          <Text className="text-[#282B4A]/60 text-center mb-8 px-4 leading-5">
            Your honest feedback helps us build a personalised regret forecast for you.
          </Text>

          <View className="flex-row justify-between gap-4">
            <TouchableOpacity
              onPress={() => record("regretted")}
              disabled={saving}
              className="flex-1 bg-white p-4 rounded-[24px] items-center border border-[#282B4A]/[0.05] shadow-sm"
              activeOpacity={0.7}
            >
              <Text className="text-4xl mb-2">😬</Text>
              <Text className="text-[#282B4A] font-bold text-xs uppercase tracking-wider text-center">Regret it</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => record("neutral")}
              disabled={saving}
              className="flex-1 bg-white p-4 rounded-[24px] items-center border border-[#282B4A]/[0.05] shadow-sm"
              activeOpacity={0.7}
            >
              <Text className="text-4xl mb-2">🤷</Text>
              <Text className="text-[#282B4A] font-bold text-xs uppercase tracking-wider text-center">Neutral</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => record("happy")}
              disabled={saving}
              className="flex-1 bg-white p-4 rounded-[24px] items-center border border-[#282B4A]/[0.05] shadow-sm"
              activeOpacity={0.7}
            >
              <Text className="text-4xl mb-2">😊</Text>
              <Text className="text-[#282B4A] font-bold text-xs uppercase tracking-wider text-center">Happy</Text>
            </TouchableOpacity>
          </View>
          
          <TouchableOpacity onPress={onDone} className="mt-8 items-center" disabled={saving}>
            <Text className="text-[#282B4A]/40 font-bold uppercase text-xs tracking-widest">Skip for now</Text>
          </TouchableOpacity>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}
