import React, { useState } from "react";
import { View, ScrollView, KeyboardAvoidingView, Platform, TouchableOpacity } from "react-native";
import { Text } from "@/components/ui/text";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { useItems } from "@/hooks/useItems";
import { useCollections } from "@/hooks/useCollections";
import { useRouter } from "expo-router";
import { DelayType, WishlistItem } from "@/lib/types";
import { SourceLinkInput } from "@/components/SourceLinkInput";
import { DelayPicker } from "@/components/DelayPicker";
import { Camera, Plus, Sparkles, ChevronDown } from "lucide-react-native";
import { computeRegretScore } from "@/lib/regret-score";
import { scheduleReminder } from "@/lib/notifications";
import { useAppStore } from "@/lib/store";
export default function AddItem() {
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [notes, setNotes] = useState("");
  const [collectionId, setCollectionId] = useState<string | undefined>(undefined);
  const [delay, setDelay] = useState<DelayType>("7d");
  const [sourceUrl, setSourceUrl] = useState("");
  const [tiktokUrl, setTiktokUrl] = useState("");
  const [instagramUrl, setInstagramUrl] = useState("");
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
        currency: "€",
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

      // Schedule Notification
      if (savedItem) {
        await scheduleReminder(savedItem, null, category);
      }

      router.replace("/(tabs)/items");
    } catch (e: any) {
      showAlert("Error", e.message, "error");
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1 bg-background"
    >
      <ScrollView className="flex-1 p-6" contentContainerStyle={{ paddingBottom: 100 }}>
        <View className="items-center mb-8">
          <TouchableOpacity className="w-32 h-32 bg-muted rounded-[40px] items-center justify-center border-2 border-dashed border-cream-300">
            <Camera size={32} className="text-cream-400" />
            <Text className="text-cream-400 text-xs font-bold mt-2">Add Photo</Text>
          </TouchableOpacity>
        </View>

        <View className="gap-6">
          {/* Basic Info */}
          <View className="gap-4">
            <View className="gap-2">
              <Label nativeID="title-label">What is it?</Label>
              <Input
                placeholder="Pink Mechanical Keyboard..."
                value={title}
                onChangeText={setTitle}
                className="bg-card border-none h-12 text-lg font-medium"
                aria-labelledby="title-label"
              />
            </View>

            <View className="flex-row gap-4">
              <View className="flex-1 gap-2">
                <Label nativeID="price-label">Price</Label>
                <View className="relative">
                  <Text className="absolute left-3 top-3.5 z-10 font-bold text-blue-300">€</Text>
                  <Input
                    placeholder="0.00"
                    value={price}
                    onChangeText={setPrice}
                    keyboardType="numeric"
                    className="bg-card border-none h-12 pl-8 font-bold"
                    aria-labelledby="price-label"
                  />
                </View>
              </View>

              <View className="flex-1 gap-2">
                <Label>Category</Label>
                <TouchableOpacity
                  className="bg-card h-12 rounded-xl px-3 flex-row items-center justify-between"
                  onPress={() => {/* Show category picker modal */ }}
                >
                  <Text className="text-foreground font-medium">
                    {collections.find(c => c.id === collectionId)?.name || "Select..."}
                  </Text>
                  <ChevronDown size={16} className="text-muted-foreground" />
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Delay Picker */}
          <View className="gap-3">
            <View className="flex-row items-center gap-2">
              <Sparkles size={16} className="text-primary" />
              <Label>How long will you wait?</Label>
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
          <View className="gap-2">
            <Label>Notes</Label>
            <Input
              placeholder="Why do you want this? How will it improve your life?"
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={3}
              className="bg-card border-none p-3 h-24"
            />
          </View>

          <Button
            onPress={handleSave}
            disabled={isAdding || !title}
            className="h-14 rounded-2xl shadow-lg shadow-primary/20 mt-4"
          >
            <Text className="text-primary-foreground font-bold text-lg">
              {isAdding ? "Saving..." : "Start Waiting 🎀"}
            </Text>
          </Button>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
