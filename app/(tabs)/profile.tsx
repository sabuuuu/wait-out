import React, { useEffect, useState } from "react";
import { View, ScrollView, TouchableOpacity, Switch } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Text } from "@/components/ui/text";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { supabase } from "@/lib/supabase";
import { User, Bell, Shield, LogOut, ChevronRight, Moon, CreditCard } from "lucide-react-native";
import { useRouter } from "expo-router";
import { useAppStore } from "@/lib/store";

export default function Profile() {
  const insets = useSafeAreaInsets();
  const { showAlert } = useAppStore();
  const [email, setEmail] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    getUser();
  }, []);

  async function getUser() {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setEmail(user.email ?? null);
      setDisplayName(user.user_metadata?.full_name ?? "Wait Out User");
    }
  }

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
        <Text className="text-4xl font-fancy text-[#282B4A]">Profile</Text>
        <Text className="text-[13px] text-[#282B4A]/40 font-medium mt-2">Your intentional journey settings.</Text>
      </View>

      <View className="px-6 items-center py-6">
        <View className="w-24 h-24 bg-white rounded-full items-center justify-center mb-4 shadow-sm border border-[#282B4A]/5">
          <User size={48} color="#282B4A" opacity={0.6} />
        </View>
        <Text className="text-2xl font-bold text-[#282B4A]">{displayName}</Text>
        <Text className="text-[#282B4A]/50 font-medium">{email}</Text>

        <TouchableOpacity className="mt-6 px-6 py-2.5 rounded-full bg-[#282B4A] shadow-sm">
          <Text className="text-[#EEEBDA] text-xs font-bold uppercase tracking-widest">Edit Profile</Text>
        </TouchableOpacity>
      </View>

      <View className="px-6 gap-6 mt-4">
        {/* Account Settings */}
        <View className="gap-3">
          <Text className="text-[11px] font-bold text-[#282B4A]/40 uppercase tracking-widest ml-1">
            Account
          </Text>
          <View className="bg-white rounded-[32px] overflow-hidden border border-[#282B4A]/5 shadow-sm">
            <TouchableOpacity className="flex-row items-center justify-between p-5 border-b border-[#282B4A]/5">
              <View className="flex-row items-center gap-3">
                <CreditCard size={20} color="rgba(40,43,74,0.6)" />
                <Text className="text-[#282B4A] font-medium">Currency Settings</Text>
              </View>
              <View className="flex-row items-center gap-2">
                <Text className="text-[#282B4A]/40 text-sm font-bold">DZD</Text>
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
              <Switch value={true} onValueChange={() => { }} thumbColor="#EEEBDA" trackColor={{ true: '#282B4A', false: 'rgba(40,43,74,0.1)' }} />
            </View>
            <View className="flex-row items-center justify-between p-5">
              <View className="flex-row items-center gap-3">
                <Moon size={20} color="rgba(40,43,74,0.6)" />
                <Text className="text-[#282B4A] font-medium">Quiet Hours</Text>
              </View>
              <Text className="text-[#282B4A]/40 text-sm font-bold">22:00 - 08:00</Text>
            </View>
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
    </ScrollView>
  );
}

