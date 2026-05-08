import React, { useState } from "react";
import { View, ScrollView, KeyboardAvoidingView, Platform, TouchableOpacity } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Text } from "@/components/ui/text";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/lib/supabase";
import { useItems } from "@/hooks/useItems";
import { useCollections } from "@/hooks/useCollections";
import { useRouter, useLocalSearchParams } from "expo-router";
import { DelayType, WishlistItem } from "@/lib/types";
import { DelayPicker } from "@/components/DelayPicker";
import { CollectionPickerModal } from "@/components/CollectionPickerModal";
import { Camera, Sparkles, ChevronDown, Link2, Instagram, Video } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { computeRegretScore } from "@/lib/regret-score";
import { scheduleReminder } from "@/lib/notifications";
import { useAppStore } from "@/lib/store";

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
  const router = useRouter();

  const calculateRemindAt = (type: DelayType): string => {
    const now = new Date();
    switch (type) {
      case "3d": return new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString();
      case "7d": return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();
      case "2w": return new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000).toISOString();
      case "payday": {
        const next = new Date(now.getFullYear(), now.getMonth() + 1, 1);
        return next.toISOString();
      }
      default: return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();
    }
  };

  async function handleSave() {
    if (!title) {
      showAlert("Wait!", "Please give your item a name.");
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      showAlert("Error", "You must be signed in to save items.", "error");
      return;
    }

    const priceNum = parseFloat(price.replace(",", ".")) || 0;
    const remindAt = calculateRemindAt(delay);
    const addedHour = new Date().getHours();
    const category = collections.find(c => c.id === collectionId);

    const collectionItems = items.filter(i => i.collection_id === collectionId);
    const avgSpend = collectionItems.length > 0
      ? collectionItems.reduce((acc, curr) => acc + (curr.price || 0), 0) / collectionItems.length
      : priceNum;

    const historyIgnored = collectionItems.filter(i => i.status === 'forgot').length;

    const { score, factors } = computeRegretScore(
      { price: priceNum, added_hour: addedHour, collection_id: collectionId },
      avgSpend,
      historyIgnored,
      category?.name
    );

    try {
      const newItemData: Omit<WishlistItem, "id" | "updated_at"> = {
        user_id: user.id,
        collection_id: collectionId,
        title,
        notes: notes || undefined,
        price: priceNum,
        currency: "DZD",
        source_url: sourceUrl || undefined,
        tiktok_url: tiktokUrl || undefined,
        instagram_url: instagramUrl || undefined,
        added_at: new Date().toISOString(),
        added_hour: addedHour,
        delay_type: delay,
        remind_at: remindAt,
        status: "waiting",
        regret_score: score,
        score_factors: factors,
      };

      const savedItem = await addItem(newItemData);

      if (savedItem) {
        await scheduleReminder(savedItem, null, category);
      }

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace("/(tabs)/items");
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

          {/* Photo & Title Row */}
          <View className="flex-row gap-4 items-end">
            <TouchableOpacity
              className="w-20 h-20 bg-white rounded-2xl items-center justify-center border border-[#282B4A]/[0.05] shadow-sm"
              activeOpacity={0.7}
            >
              <Camera size={22} color="rgba(40,43,74,0.4)" />
              <Text className="text-[#282B4A]/40 text-[9px] font-outfit-bold uppercase tracking-wider mt-1.5">Photo</Text>
            </TouchableOpacity>

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
                <Text className="font-outfit-bold text-[#282B4A]/40 text-[13px] ml-2">DZD</Text>
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

          {/* Unified Links Card */}
          <View className="gap-2">
            <Label className="text-[10px] text-[#282B4A]/50 uppercase font-outfit-bold tracking-widest ml-1">Where did you find it?</Label>
            <View className="bg-white rounded-[20px] border border-[#282B4A]/[0.05] shadow-sm overflow-hidden">

              {/* Web Link */}
              <View className="flex-row items-center px-4 h-14 border-b border-[#282B4A]/[0.04]">
                <Link2 size={18} color="rgba(40,43,74,0.4)" />
                <Input
                  placeholder="Website Link..."
                  placeholderTextColor="rgba(40,43,74,0.3)"
                  value={sourceUrl}
                  onChangeText={setSourceUrl}
                  autoCapitalize="none"
                  keyboardType="url"
                  className="flex-1 h-full ml-3 text-[14px] text-[#282B4A] border-none bg-transparent shadow-none px-0 font-outfit"
                />
              </View>

              {/* Instagram */}
              <View className="flex-row items-center px-4 h-14 border-b border-[#282B4A]/[0.04]">
                <Instagram size={18} color="rgba(40,43,74,0.4)" />
                <Input
                  placeholder="Instagram Post..."
                  placeholderTextColor="rgba(40,43,74,0.3)"
                  value={instagramUrl}
                  onChangeText={setInstagramUrl}
                  autoCapitalize="none"
                  keyboardType="url"
                  className="flex-1 h-full ml-3 text-[14px] text-[#282B4A] border-none bg-transparent shadow-none px-0 font-outfit"
                />
              </View>

              {/* TikTok */}
              <View className="flex-row items-center px-4 h-14">
                <Video size={18} color="rgba(40,43,74,0.4)" />
                <Input
                  placeholder="TikTok Video..."
                  placeholderTextColor="rgba(40,43,74,0.3)"
                  value={tiktokUrl}
                  onChangeText={setTiktokUrl}
                  autoCapitalize="none"
                  keyboardType="url"
                  className="flex-1 h-full ml-3 text-[14px] text-[#282B4A] border-none bg-transparent shadow-none px-0 font-outfit"
                />
              </View>
            </View>
          </View>

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