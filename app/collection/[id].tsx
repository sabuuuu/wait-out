import React, { useState } from "react";
import { View, Switch, ScrollView, TouchableOpacity } from "react-native";
import { useLocalSearchParams, router, Stack } from "expo-router";
import { useCollections } from "@/hooks/useCollections";
import { scheduleDigest } from "@/lib/notifications";
import { NotifFrequency } from "@/lib/types";
import { Text } from "@/components/ui/text";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Bell, Clock, Calendar, ShieldCheck, ChevronLeft } from "lucide-react-native";

const FREQ_OPTIONS: { label: string; value: NotifFrequency; desc: string; icon: any }[] = [
  { label: "When it expires", value: "on_schedule", desc: "One push when the wait timer runs out", icon: Clock },
  { label: "Daily digest", value: "daily_digest", desc: "A daily summary at a time you choose", icon: Bell },
  { label: "Weekly digest", value: "weekly_digest", desc: "Once a week recap", icon: Calendar },
  { label: "Never", value: "never", desc: "No notifications for this collection", icon: ShieldCheck },
];

export default function CollectionSettingsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { collections, updateCollection } = useCollections();
  const col = collections.find((c) => c.id === id);
  
  const [enabled, setEnabled] = useState(col?.notif_enabled ?? true);
  const [frequency, setFrequency] = useState<NotifFrequency>(col?.notif_frequency ?? "on_schedule");
  const [saving, setSaving] = useState(false);

  if (!col) return null;

  async function handleSave() {
    if (!col) return;
    setSaving(true);
    try {
      const updated = await updateCollection({
        id: col.id,
        notif_enabled: enabled,
        notif_frequency: frequency,
      });
      if (enabled && frequency !== "on_schedule" && frequency !== "never") {
        await scheduleDigest(updated);
      }
      router.back();
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  }

  return (
    <View className="flex-1 bg-[#EEEBDA]">
      <Stack.Screen
        options={{
          headerShown: true,
          title: "Alert Settings",
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()} className="ml-2">
              <ChevronLeft size={24} color="#282B4A" />
            </TouchableOpacity>
          ),
          headerStyle: {
            backgroundColor: "#EEEBDA",
          },
          headerTitleStyle: {
            fontFamily: "Outfit_700Bold",
            color: "#282B4A",
          },
          headerShadowVisible: false,
        }}
      />
      
      <ScrollView 
        className="flex-1"
        contentContainerStyle={{ 
          paddingHorizontal: 24, 
          paddingTop: 20,
          paddingBottom: Math.max(insets.bottom, 20) + 20 
        }}
      >
        <View className="mb-8">
          <View className="flex-row items-center gap-3 mb-2">
            <View className="w-12 h-12 bg-white rounded-2xl items-center justify-center shadow-sm border border-[#282B4A]/5">
              <Text className="text-2xl">{col.emoji}</Text>
            </View>
            <View>
              <Text className="text-2xl font-fancy text-[#282B4A]">{col.name}</Text>
              <Text className="text-[13px] text-[#282B4A]/40 font-medium">Notification Preferences</Text>
            </View>
          </View>
        </View>

        {/* Master toggle */}
        <Card className="bg-white rounded-[32px] border border-[#282B4A]/5 shadow-sm mb-6">
          <CardContent className="p-6 flex-row items-center justify-between">
            <View className="flex-1 mr-4">
              <Text className="font-bold text-[#282B4A] text-base">Allow Notifications</Text>
              <Text className="text-[12px] text-[#282B4A]/50 font-medium mt-1">Get reminders for items in this collection</Text>
            </View>
            <Switch
              value={enabled}
              onValueChange={setEnabled}
              trackColor={{ true: "#282B4A", false: "rgba(40,43,74,0.1)" }}
              thumbColor="#EEEBDA"
            />
          </CardContent>
        </Card>

        {/* Frequency picker */}
        {enabled && (
          <View className="mb-8">
            <Text className="text-[11px] font-bold text-[#282B4A]/40 uppercase tracking-widest ml-1 mb-4">Frequency</Text>
            <View className="gap-3">
              {FREQ_OPTIONS.map((opt) => {
                const Icon = opt.icon;
                const isActive = frequency === opt.value;
                return (
                  <TouchableOpacity
                    key={opt.value}
                    onPress={() => setFrequency(opt.value)}
                    activeOpacity={0.7}
                    className={`bg-white rounded-[28px] p-5 flex-row items-center border ${isActive ? 'border-[#282B4A]' : 'border-[#282B4A]/5'} shadow-sm`}
                  >
                    <View className={`w-10 h-10 rounded-full items-center justify-center mr-4 ${isActive ? 'bg-[#282B4A]/5' : 'bg-[#282B4A]/[0.02]'}`}>
                      <Icon size={20} color={isActive ? "#282B4A" : "rgba(40,43,74,0.4)"} />
                    </View>
                    <View className="flex-1">
                      <Text className={`font-bold text-sm ${isActive ? 'text-[#282B4A]' : 'text-[#282B4A]/60'}`}>{opt.label}</Text>
                      <Text className="text-[11px] text-[#282B4A]/40 font-medium mt-0.5">{opt.desc}</Text>
                    </View>
                    <View className={`w-5 h-5 rounded-full border-2 items-center justify-center ${isActive ? 'border-[#282B4A]' : 'border-[#282B4A]/10'}`}>
                      {isActive && <View className="w-2.5 h-2.5 rounded-full bg-[#282B4A]" />}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        <Button 
          onPress={handleSave} 
          disabled={saving}
          className="bg-[#282B4A] h-16 rounded-3xl items-center justify-center mt-4 shadow-md"
        >
          <Text className="text-[#EEEBDA] font-bold text-base tracking-wide">{saving ? "Saving Changes..." : "Save Preferences"}</Text>
        </Button>
      </ScrollView>
    </View>
  );
}
