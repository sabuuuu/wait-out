import React, { useMemo } from "react";
import { View, ScrollView, TouchableOpacity, Share, Linking } from "react-native";
import { useLocalSearchParams, Stack, useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { useItems } from "@/hooks/useItems";
import { Text } from "@/components/ui/text";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Timer,
  ShoppingBag,
  Ghost,
  Trash2,
  ExternalLink,
  Clock,
  AlertCircle,
  Share2,
  ChevronLeft
} from "lucide-react-native";

export default function ItemDetail() {
  const { id } = useLocalSearchParams();
  const { items, updateItem, deleteItem } = useItems();
  const router = useRouter();

  const item = useMemo(() => items.find((i) => i.id === id), [items, id]);

  if (!item) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <Text>Item not found</Text>
        <Button onPress={() => router.back()} className="mt-4">
          <Text>Go Back</Text>
        </Button>
      </View>
    );
  }

  const handleDecision = async (status: 'bought' | 'forgot') => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      await updateItem({ id: item.id, status });
      router.back();
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async () => {
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      await deleteItem(item.id);
      router.back();
    } catch (e) {
      console.error(e);
    }
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `I'm waiting out this purchase: ${item.title} (${item.currency}${item.price}). Patience is a virtue! 🎀`,
        url: item.source_url,
      });
    } catch (error) {
      console.log(error);
    }
  };

  const openLink = (url?: string) => {
    if (url) Linking.openURL(url);
  };

  const isExpired = new Date(item.remind_at) <= new Date();

  return (
    <ScrollView className="flex-1 bg-background">
      <Stack.Screen
        options={{
          title: "Item Details",
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()} className="ml-2">
              <ChevronLeft size={24} className="text-foreground" />
            </TouchableOpacity>
          ),
          headerRight: () => (
            <TouchableOpacity onPress={handleShare} className="mr-2">
              <Share2 size={20} className="text-foreground" />
            </TouchableOpacity>
          ),
        }}
      />

      {/* Hero Section */}
      <View className="h-64 bg-muted items-center justify-center relative">
        <View className="bg-card/50 p-6 rounded-[40px]">
          {item.status === 'waiting' && <Timer size={64} className="text-primary" />}
          {item.status === 'bought' && <ShoppingBag size={64} className="text-blue-300" />}
          {item.status === 'forgot' && <Ghost size={64} className="text-muted-foreground" />}
        </View>

        {/* Status Badge */}
        <View className="absolute bottom-6 right-6 bg-blue-500 px-4 py-2 rounded-2xl">
          <Text className="text-white font-bold text-xs uppercase tracking-widest">{item.status}</Text>
        </View>
      </View>

      <View className="p-6 -mt-8 bg-background rounded-t-[40px]">
        <View className="flex-row justify-between items-start mb-4">
          <View className="flex-1 mr-4">
            <Text className="text-2xl font-display text-foreground">{item.title}</Text>
            <Text className="text-primary text-2xl font-bold mt-1">{item.currency}{item.price}</Text>
          </View>
          <View className="bg-secondary px-3 py-1.5 rounded-xl">
            <Text className="text-primary font-bold text-xs uppercase">{item.delay_type}</Text>
          </View>
        </View>

        {/* Regret Score Alert */}
        {item.regret_score > 30 && (
          <Card className="bg-destructive/10 border-destructive/20 mb-6">
            <CardContent className="p-4 flex-row items-center gap-3">
              <AlertCircle size={20} className="text-destructive" />
              <Text className="flex-1 text-destructive font-medium text-sm">
                High Regret Risk: We estimate a {item.regret_score}% chance you might regret this later.
              </Text>
            </CardContent>
          </Card>
        )}

        {/* Progress Card */}
        <Card className="bg-card border-none shadow-sm mb-6">
          <CardContent className="p-5">
            <View className="flex-row items-center justify-between mb-3">
              <View className="flex-row items-center gap-2">
                <Clock size={16} className="text-blue-300" />
                <Text className="text-blue-300 font-bold text-xs uppercase">Time Left</Text>
              </View>
              <Text className="text-foreground font-bold">
                {isExpired ? "Time to decide!" : "Waiting..."}
              </Text>
            </View>
            <View className="h-2 bg-muted rounded-full overflow-hidden">
              <View className="h-full bg-primary" style={{ width: isExpired ? '100%' : '40%' }} />
            </View>
            <Text className="text-muted-foreground text-xs mt-3">
              Added: {new Date(item.added_at).toLocaleDateString()} ·
              Ends: {new Date(item.remind_at).toLocaleDateString()}
            </Text>
          </CardContent>
        </Card>

        {/* Notes */}
        {item.notes && (
          <View className="mb-6">
            <Text className="text-xs text-blue-300 font-bold uppercase mb-2 ml-1">Your Thoughts</Text>
            <Text className="text-foreground italic leading-5">"{item.notes}"</Text>
          </View>
        )}

        {/* Links */}
        {(item.source_url || item.tiktok_url || item.instagram_url) && (
          <View className="mb-8">
            <Text className="text-xs text-blue-300 font-bold uppercase mb-3 ml-1">Sources</Text>
            <View className="flex-row flex-wrap gap-2">
              {item.source_url && (
                <TouchableOpacity onPress={() => openLink(item.source_url)} className="flex-row items-center bg-muted px-4 py-2 rounded-xl">
                  <ExternalLink size={14} className="text-foreground mr-2" />
                  <Text className="text-foreground font-bold text-xs">Website</Text>
                </TouchableOpacity>
              )}
              {item.tiktok_url && (
                <TouchableOpacity onPress={() => openLink(item.tiktok_url)} className="flex-row items-center bg-muted px-4 py-2 rounded-xl">
                  <ExternalLink size={14} className="text-foreground mr-2" />
                  <Text className="text-foreground font-bold text-xs">TikTok</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}

        {/* Decision Buttons */}
        <View className="gap-3 mt-4">
          <Button
            variant="outline"
            className="h-14 rounded-2xl border-blue-500"
            onPress={() => handleDecision('bought')}
          >
            <ShoppingBag size={20} className="text-foreground mr-2" />
            <Text className="text-foreground font-bold text-base">I bought it</Text>
          </Button>

          <Button
            className="h-14 rounded-2xl bg-blue-500"
            onPress={() => handleDecision('forgot')}
          >
            <Ghost size={20} className="text-white mr-2" />
            <Text className="text-white font-bold text-base">I forgot about it! 🥂</Text>
          </Button>

          <TouchableOpacity onPress={handleDelete} className="items-center mt-6">
            <View className="flex-row items-center gap-2">
              <Trash2 size={16} className="text-destructive" />
              <Text className="text-destructive font-bold">Remove Item</Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}
