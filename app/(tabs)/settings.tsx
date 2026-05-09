import React, { useEffect, useState } from "react";
import { View, ScrollView, TouchableOpacity, Switch, TextInput } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Text } from "@/components/ui/text";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { supabase } from "@/lib/supabase";
import { User, Bell, Shield, LogOut, ChevronRight, Moon, CreditCard, LayoutGrid, CalendarDays } from "lucide-react-native";
import { useRouter } from "expo-router";
import { useAppStore } from "@/lib/store";
import { useProfile } from "@/hooks/useProfile";
import { ManageCollectionsModal } from "@/components/ManageCollectionsModal";

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const { showAlert } = useAppStore();
  const { profile, prefs, updateProfile, updatePrefs } = useProfile();
  const [loading, setLoading] = useState(false);
  const [isCollectionsModalVisible, setIsCollectionsModalVisible] = useState(false);
  const router = useRouter();

  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setEmail(user.email ?? null);
    });
  }, []);

  async function handleSignOut() {
    setLoading(true);
    const { error } = await supabase.auth.signOut();
    if (error) showAlert("Error", error.message, "error");
    setLoading(false);
  }

  return (
    <ScrollView
      className="flex-1 bg-[#EEEBDA]"
      contentContainerStyle={{
        paddingTop: Math.max(insets.top, 20),
        paddingBottom: Math.max(insets.bottom, 20) + 100
      }}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View className="px-6 pt-10 pb-4">
        <Text className="text-4xl font-fancy text-[#282B4A]">Settings</Text>
        <Text className="text-[13px] text-[#282B4A]/40 font-medium mt-2">Personalize your patience experience.</Text>
      </View>

      <View className="px-6 items-center py-6">
        <View className="w-24 h-24 bg-white rounded-full items-center justify-center mb-4 shadow-sm border border-[#282B4A]/5">
          <User size={48} color="#282B4A" opacity={0.6} />
        </View>
        <Text className="text-2xl font-bold text-[#282B4A]">{profile?.display_name}</Text>
        <Text className="text-[#282B4A]/50 font-medium">{email}</Text>

        <TouchableOpacity 
          className="mt-6 px-6 py-2.5 rounded-full bg-[#282B4A] shadow-sm"
          onPress={() => {}} // Placeholder for future edit profile screen
        >
          <Text className="text-[#EEEBDA] text-xs font-bold uppercase tracking-widest">Edit Profile</Text>
        </TouchableOpacity>
      </View>

      <View className="px-6 gap-6 mt-4">
        {/* Collections */}
        <View className="gap-3">
          <Text className="text-[11px] font-bold text-[#282B4A]/40 uppercase tracking-widest ml-1">Collections</Text>
          <Card className="bg-white rounded-[32px] overflow-hidden border border-[#282B4A]/5 shadow-sm">
            <TouchableOpacity 
              className="flex-row items-center justify-between p-5"
              onPress={() => setIsCollectionsModalVisible(true)}
            >
              <View className="flex-row items-center gap-3">
                <LayoutGrid size={20} color="rgba(40,43,74,0.6)" />
                <View>
                  <Text className="text-[#282B4A] font-medium">Manage Categories</Text>
                  <Text className="text-[11px] text-[#282B4A]/40">Organize your wishlist items</Text>
                </View>
              </View>
              <ChevronRight size={16} color="rgba(40,43,74,0.3)" />
            </TouchableOpacity>
          </Card>
        </View>

        {/* Account Settings */}
        <View className="gap-3">
          <Text className="text-[11px] font-bold text-[#282B4A]/40 uppercase tracking-widest ml-1">Account</Text>
          <View className="bg-white rounded-[32px] overflow-hidden border border-[#282B4A]/5 shadow-sm">
            <TouchableOpacity className="flex-row items-center justify-between p-5 border-b border-[#282B4A]/5">
              <View className="flex-row items-center gap-3">
                <CreditCard size={20} color="rgba(40,43,74,0.6)" />
                <Text className="text-[#282B4A] font-medium">Currency Settings</Text>
              </View>
              <View className="flex-row items-center gap-2">
                <Text className="text-[#282B4A]/40 text-sm font-bold">{profile?.currency}</Text>
                <ChevronRight size={16} color="rgba(40,43,74,0.3)" />
              </View>
            </TouchableOpacity>
            <TouchableOpacity className="flex-row items-center justify-between p-5 border-b border-[#282B4A]/5">
              <View className="flex-row items-center gap-3">
                <CalendarDays size={20} color="rgba(40,43,74,0.6)" />
                <Text className="text-[#282B4A] font-medium">Payday Cycle</Text>
              </View>
              <View className="flex-row items-center gap-2">
                <Text className="text-[#282B4A]/40 text-sm font-bold">{profile?.payday_day ? `Day ${profile.payday_day}` : 'Not Set'}</Text>
                <ChevronRight size={16} color="rgba(40,43,74,0.3)" />
              </View>
            </TouchableOpacity>
            <TouchableOpacity className="flex-row items-center justify-between p-5">
              <View className="flex-row items-center gap-3">
                <Shield size={20} color="rgba(40,43,74,0.6)" />
                <Text className="text-[#282B4A] font-medium">Privacy & Security</Text>
              </View>
              <ChevronRight size={16} color="rgba(40,43,74,0.3)" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Notifications */}
        <View className="gap-3">
          <Text className="text-[11px] font-bold text-[#282B4A]/40 uppercase tracking-widest ml-1">Notifications</Text>
          <View className="bg-white rounded-[32px] overflow-hidden border border-[#282B4A]/5 shadow-sm">
            <View className="flex-row items-center justify-between p-5 border-b border-[#282B4A]/5">
              <View className="flex-row items-center gap-3">
                <Bell size={20} color="rgba(40,43,74,0.6)" />
                <Text className="text-[#282B4A] font-medium">Global Reminders</Text>
              </View>
              <Switch
                value={prefs?.global_enabled ?? true}
                onValueChange={(val) => { updatePrefs({ global_enabled: val }); }}
                thumbColor="#EEEBDA"
                trackColor={{ true: '#282B4A', false: 'rgba(40,43,74,0.1)' }}
              />
            </View>

            {prefs?.global_enabled && (
              <>
                <View className="p-5 border-b border-[#282B4A]/5">
                  <View className="flex-row items-center gap-3 mb-4">
                    <Moon size={20} color="rgba(40,43,74,0.6)" />
                    <Text className="text-[#282B4A] font-medium">Quiet Hours</Text>
                  </View>
                  <View className="flex-row gap-3">
                    <View className="flex-1">
                      <Text className="text-[10px] text-[#282B4A]/40 font-bold uppercase mb-1 ml-1">Start</Text>
                      <TextInput
                        value={prefs?.quiet_hours_start ?? "22:00"}
                        onChangeText={(val) => updatePrefs({ quiet_hours_start: val })}
                        placeholder="22:00"
                        className="bg-[#282B4A]/5 rounded-xl px-4 h-10 text-[#282B4A] font-medium"
                      />
                    </View>
                    <View className="flex-1">
                      <Text className="text-[10px] text-[#282B4A]/40 font-bold uppercase mb-1 ml-1">End</Text>
                      <TextInput
                        value={prefs?.quiet_hours_end ?? "08:00"}
                        onChangeText={(val) => updatePrefs({ quiet_hours_end: val })}
                        placeholder="08:00"
                        className="bg-[#282B4A]/5 rounded-xl px-4 h-10 text-[#282B4A] font-medium"
                      />
                    </View>
                  </View>
                </View>

                <View className="flex-row items-center justify-between p-5">
                  <View className="flex-row items-center gap-3">
                    <CalendarDays size={20} color="rgba(40,43,74,0.6)" />
                    <View>
                      <Text className="text-[#282B4A] font-medium">Weekly Digest</Text>
                      <Text className="text-[11px] text-[#282B4A]/40">A summary of your patience wins</Text>
                    </View>
                  </View>
                  <Switch
                    value={prefs?.notify_digest ?? false}
                    onValueChange={(val) => { updatePrefs({ notify_digest: val }); }}
                    thumbColor="#EEEBDA"
                    trackColor={{ true: '#282B4A', false: 'rgba(40,43,74,0.1)' }}
                  />
                </View>
              </>
            )}
          </View>
        </View>

        <TouchableOpacity
          onPress={handleSignOut}
          disabled={loading}
          className="mt-6 h-14 rounded-2xl flex-row items-center justify-center gap-3 bg-[#ef4444]/10"
        >
          <LogOut size={20} color="#ef4444" />
          <Text className="text-[#ef4444] font-bold text-base">Sign Out</Text>
        </TouchableOpacity>

        <Text className="text-center text-[#282B4A]/30 text-[11px] font-bold uppercase tracking-widest mt-8 pb-10">
          Pausy v1.0.0 · Made with 🎀
        </Text>
      </View>

      <ManageCollectionsModal 
        visible={isCollectionsModalVisible} 
        onClose={() => setIsCollectionsModalVisible(false)} 
      />
    </ScrollView>
  );
}
