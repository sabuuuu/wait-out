import React, { useState } from "react";
import { View, ScrollView, KeyboardAvoidingView, Platform, TouchableOpacity } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Text } from "@/components/ui/text";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/lib/supabase";
import { useItems } from "@/hooks/useItems";
import { useCollections } from "@/hooks/useCollections";
import { useProfile } from "@/hooks/useProfile";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useQueryClient } from "@tanstack/react-query";
import { DelayType, WishlistItem } from "@/lib/types";
import { DelayPicker } from "@/components/DelayPicker";
import { CollectionPickerModal } from "@/components/CollectionPickerModal";
import { SourceLinkInput } from "@/components/SourceLinkInput";
import { Sparkles, ChevronDown } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { computeRegretScore } from "@/lib/regret-score";
import { scheduleReminder } from "@/lib/notifications";
import { useAppStore } from "@/lib/store";
import { getMLRegretScore } from "@/lib/ml-predict";

export default function AddItem() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();
  const [title, setTitle] = useState((params.title as string) || "");
  const [price, setPrice] = useState("");
  const [notes, setNotes] = useState("");
  const [collectionId, setCollectionId] = useState<string | undefined>(undefined);
  const [delay, setDelay] = useState<DelayType>("7d");
  const [sourceUrl, setSourceUrl] = useState((params.url as string) || "");
  const [tiktokUrl, setTiktokUrl] = useState("");
  const [instagramUrl, setInstagramUrl] = useState("");
  const [isPickerVisible, setIsPickerVisible] = useState(false);
  const { showAlert } = useAppStore();
  const { items, addItem, isAdding } = useItems();
  const { collections } = useCollections();
  const { profile, prefs } = useProfile();
  const currency = profile?.currency ?? "DZD";
  const router = useRouter();
  // Need queryClient to invalidate the items cache after the background ML update
  const queryClient = useQueryClient();

  const calculateRemindAt = (type: DelayType): string => {
    const now = new Date();
    switch (type) {
      case "3d":    return new Date(now.getTime() + 3  * 24 * 60 * 60 * 1000).toISOString();
      case "7d":    return new Date(now.getTime() + 7  * 24 * 60 * 60 * 1000).toISOString();
      case "2w":    return new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000).toISOString();
      case "payday": {
        // Use the user's configured payday day, falling back to the 1st
        const paydayDay = profile?.payday_day ?? 1;
        const now2 = new Date();
        // If payday this month hasn't passed yet, use it; otherwise next month
        const thisMonth = new Date(now2.getFullYear(), now2.getMonth(), paydayDay);
        const next = thisMonth > now2
          ? thisMonth
          : new Date(now2.getFullYear(), now2.getMonth() + 1, paydayDay);
        return next.toISOString();
      }
      // "custom" is not yet implemented — falls back to 7d.
      // This case is unreachable from the UI since DelayPicker doesn't
      // render the Custom option, but the type union still includes it.
      case "custom":
      default:
        return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();
    }
  };

  async function handleSave() {
    if (!title) {
      showAlert("Wait!", "Please give your item a name.");
      return;
    }

    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      showAlert("Error", "You must be signed in to save items.", "error");
      return;
    }

    const priceNum = parseFloat(price.replace(",", ".")) || 0;
    const remindAt = calculateRemindAt(delay);
    const addedHour = new Date().getHours();
    const addedDayOfWeek = new Date().getDay();
    const category = collections.find(c => c.id === collectionId);

    const detectPlatform = (url: string): "tiktok" | "instagram" | "web" | "unknown" => {
      if (!url) return "unknown";
      if (url.includes("tiktok")) return "tiktok";
      if (url.includes("instagram")) return "instagram";
      return "web";
    };
    const sourcePlatform = detectPlatform(tiktokUrl || instagramUrl || sourceUrl);
    const categorySlug = category?.name?.toLowerCase() || "other";

    // ── V1 score (synchronous, always available) ──────────────────────────
    const collectionItems = items.filter(i => i.collection_id === collectionId);
    const avgSpend = collectionItems.length > 0
      ? collectionItems.reduce((acc, curr) => acc + (curr.price || 0), 0) / collectionItems.length
      : priceNum;
    const historyIgnored = collectionItems.filter(i => i.status === "forgot").length;

    const { score: v1Score, factors: v1Factors } = computeRegretScore(
      { price: priceNum, added_hour: addedHour, collection_id: collectionId },
      avgSpend,
      historyIgnored,
      category?.name
    );

    try {
      // ── Save immediately with V1 score ────────────────────────────────
      // The ML call is fired in the background after saving so the user
      // gets instant feedback. If ML returns a result, we update the item.
      const newItemData: Omit<WishlistItem, "id" | "updated_at"> = {
        user_id: session.user.id,
        collection_id: collectionId,
        title,
        notes: notes || undefined,
        price: priceNum,
        currency,
        source_url: sourceUrl || undefined,
        tiktok_url: tiktokUrl || undefined,
        instagram_url: instagramUrl || undefined,
        added_at: new Date().toISOString(),
        added_hour: addedHour,
        added_day_of_week: addedDayOfWeek,
        source_platform: sourcePlatform,
        category_slug: categorySlug,
        session_items_count: 1,
        delay_type: delay,
        remind_at: remindAt,
        status: "waiting",
        regret_score: v1Score,
        score_factors: v1Factors,
      };

      const savedItem = await addItem(newItemData);

      if (savedItem) {
        // Pass the user's notification prefs so quiet hours are enforced.
        // Previously null was passed here, meaning quiet hours were never checked.
        await scheduleReminder(savedItem, prefs ?? null, category);
      }

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace("/(tabs)/items");

      // ── ML score (async, non-blocking) ────────────────────────────────
      // Pre-filter history to the same category to avoid passing the full
      // items array into extractFeatures unnecessarily.
      if (savedItem) {
        const categoryHistory = items.filter(i => i.category_slug === categorySlug);
        const mlItem: WishlistItem = {
          ...savedItem,
          added_hour: addedHour,
          added_day_of_week: addedDayOfWeek,
          source_platform: sourcePlatform,
          category_slug: categorySlug,
          session_items_count: 1,
        };

        getMLRegretScore(mlItem, categoryHistory).then(async (mlResult) => {
          if (mlResult.probability !== null) {
            const mlScore = Math.round(mlResult.probability * 100);
            // Silently update the saved item with the ML score in the background,
            // then invalidate the cache so the item detail screen shows the new score.
            await supabase
              .from("items")
              .update({
                regret_score: mlScore,
                score_factors: mlResult.topFactors,
                updated_at: new Date().toISOString(),
              })
              .eq("id", savedItem.id);

            queryClient.invalidateQueries({ queryKey: ["items"] });
          }
        }).catch(() => {
          // ML update failing silently is fine — V1 score is already saved
        });
      }
    } catch (e: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      showAlert("Error", e.message, "error");
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1 bg-[#EEEBDA]"
    >
      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          paddingTop: Math.max(insets.top, 20),
          paddingBottom: Math.max(insets.bottom, 20) + 100
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View className="px-6 pt-6 pb-6">
          <Text className="text-4xl font-fancy text-[#282B4A]">Add Item</Text>
          <Text className="text-[13px] text-[#282B4A]/50 font-outfit-medium mt-1">Commit to the wait.</Text>
        </View>

        <View className="px-6 gap-7">

          {/* Title Row — photo upload not yet implemented */}
          <View className="flex-1 gap-2">
            <Label nativeID="title-label" className="text-[10px] text-[#282B4A]/50 uppercase font-outfit-bold tracking-widest ml-1">What is it?</Label>
            <Input
              placeholder="Pink Mechanical Keyboard..."
              placeholderTextColor="rgba(40,43,74,0.3)"
              value={title}
              onChangeText={setTitle}
              className="bg-white border-[#282B4A]/[0.05] h-14 rounded-2xl px-4 text-[15px] font-outfit-medium text-[#282B4A] shadow-sm"
              aria-labelledby="title-label"
            />
          </View>

          {/* Price & Category Row */}
          <View className="flex-row gap-4">
            {/* Inline Price Input */}
            <View className="flex-1 gap-2">
              <Label nativeID="price-label" className="text-[10px] text-[#282B4A]/50 uppercase font-outfit-bold tracking-widest ml-1">Price</Label>
              <View className="flex-row items-center bg-white border border-[#282B4A]/[0.05] h-14 rounded-2xl px-4 shadow-sm">
                <Input
                  placeholder="0.00"
                  placeholderTextColor="rgba(40,43,74,0.3)"
                  value={price}
                  onChangeText={setPrice}
                  keyboardType="decimal-pad"
                  className="flex-1 h-full text-[16px] font-outfit-bold text-[#282B4A] border-none bg-transparent shadow-none px-0"
                  aria-labelledby="price-label"
                />
                <Text className="font-outfit-bold text-[#282B4A]/40 text-[13px] ml-2">{currency}</Text>
              </View>
            </View>

            {/* Category Picker */}
            <View className="flex-1 gap-2">
              <Label className="text-[10px] text-[#282B4A]/50 uppercase font-outfit-bold tracking-widest ml-1">Category</Label>
              <TouchableOpacity
                className="bg-white h-14 rounded-2xl px-4 flex-row items-center justify-between border border-[#282B4A]/[0.05] shadow-sm"
                onPress={() => {
                  Haptics.selectionAsync();
                  setIsPickerVisible(true);
                }}
                activeOpacity={0.7}
              >
                <Text className={`font-outfit-medium ${collectionId ? 'text-[#282B4A]' : 'text-[#282B4A]/40'}`}>
                  {collections.find(c => c.id === collectionId)?.name || "Select..."}
                </Text>
                <ChevronDown size={16} color="rgba(40,43,74,0.3)" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Delay Picker */}
          <View className="gap-3 mt-2">
            <View className="flex-row items-center gap-1.5 ml-1">
              <Sparkles size={14} color="#282B4A" opacity={0.4} />
              <Label className="text-[10px] text-[#282B4A]/50 uppercase font-outfit-bold tracking-widest">How long will you wait?</Label>
            </View>
            <DelayPicker selected={delay} onChange={setDelay} />
          </View>

          {/* Source Links */}
          <SourceLinkInput
            sourceUrl={sourceUrl}
            onChangeSource={setSourceUrl}
            tiktokUrl={tiktokUrl}
            onChangeTiktok={setTiktokUrl}
            instagramUrl={instagramUrl}
            onChangeInstagram={setInstagramUrl}
          />

          {/* Notes */}
          <View className="gap-2 mt-2">
            <Label className="text-[10px] text-[#282B4A]/50 uppercase font-outfit-bold tracking-widest ml-1">Notes</Label>
            <Input
              placeholder="Why do you want this? How will it improve your life?"
              placeholderTextColor="rgba(40,43,74,0.3)"
              value={notes}
              onChangeText={setNotes}
              multiline
              textAlignVertical="top"
              className="bg-white border-[#282B4A]/[0.05] p-5 h-28 rounded-[20px] shadow-sm text-[14px] text-[#282B4A] leading-5 font-outfit"
            />
          </View>

          {/* Save Button */}
          <TouchableOpacity
            onPress={handleSave}
            disabled={isAdding || !title}
            className={`h-14 rounded-[20px] items-center justify-center mt-4 bg-[#282B4A] ${isAdding || !title ? 'opacity-50' : 'opacity-100'} shadow-md`}
            activeOpacity={0.8}
          >
            <Text className="text-[#EEEBDA] font-outfit-bold text-[15px] tracking-wide">
              {isAdding ? "Saving..." : "Start Waiting"}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <CollectionPickerModal 
        visible={isPickerVisible} 
        onClose={() => setIsPickerVisible(false)} 
        selectedId={collectionId}
        onSelect={(id) => {
          Haptics.selectionAsync();
          setCollectionId(id);
        }}
      />
    </KeyboardAvoidingView>
  );
}