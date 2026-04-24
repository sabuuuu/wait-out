import React, { useEffect, useState } from "react";
import { View, ScrollView, TouchableOpacity, Switch } from "react-native";
import { Text } from "@/components/ui/text";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { supabase } from "@/lib/supabase";
import { User, Bell, Shield, LogOut, ChevronRight, Moon, CreditCard } from "lucide-react-native";
import { useRouter } from "expo-router";
import { useAppStore } from "@/lib/store";

export default function Profile() {
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
    <ScrollView className="flex-1 bg-background">
      <View className="p-6 pt-12 items-center">
        <View className="w-24 h-24 bg-primary/10 rounded-full items-center justify-center mb-4">
          <User size={48} color="#EEEBDA" />
        </View>
        <Text className="text-2xl font-display text-foreground">{displayName}</Text>
        <Text className="text-muted-foreground">{email}</Text>

        <Button variant="outline" className="mt-4 px-6 rounded-full border-primary h-10">
          <Text className="text-primary text-xs font-bold uppercase">Edit Profile</Text>
        </Button>
      </View>

      <View className="p-6 gap-6">
        {/* Account Settings */}
        <View className="gap-3">
          <Text className="text-xs font-bold text-blue-300 uppercase ml-1">Account</Text>
          <Card className="border-none shadow-sm">
            <CardContent className="p-0">
              <TouchableOpacity className="flex-row items-center justify-between p-4 border-b border-muted">
                <View className="flex-row items-center gap-3">
                  <CreditCard size={20} className="text-blue-300" />
                  <Text className="text-foreground font-medium">Currency Settings</Text>
                </View>
                <View className="flex-row items-center gap-2">
                  <Text className="text-muted-foreground text-sm">EUR (€)</Text>
                  <ChevronRight size={16} className="text-muted-foreground" />
                </View>
              </TouchableOpacity>
              <TouchableOpacity className="flex-row items-center justify-between p-4">
                <View className="flex-row items-center gap-3">
                  <Shield size={20} className="text-blue-300" />
                  <Text className="text-foreground font-medium">Privacy & Security</Text>
                </View>
                <ChevronRight size={16} className="text-muted-foreground" />
              </TouchableOpacity>
            </CardContent>
          </Card>
        </View>

        {/* Notifications */}
        <View className="gap-3">
          <Text className="text-xs font-bold text-blue-300 uppercase ml-1">Notifications</Text>
          <Card className="border-none shadow-sm">
            <CardContent className="p-0">
              <View className="flex-row items-center justify-between p-4 border-b border-muted">
                <View className="flex-row items-center gap-3">
                  <Bell size={20} className="text-blue-300" />
                  <Text className="text-foreground font-medium">Global Reminders</Text>
                </View>
                <Switch value={true} onValueChange={() => { }} />
              </View>
              <View className="flex-row items-center justify-between p-4">
                <View className="flex-row items-center gap-3">
                  <Moon size={20} className="text-blue-300" />
                  <Text className="text-foreground font-medium">Quiet Hours</Text>
                </View>
                <Text className="text-muted-foreground text-sm">22:00 - 08:00</Text>
              </View>
            </CardContent>
          </Card>
        </View>

        <Button
          onPress={handleSignOut}
          variant="destructive"
          disabled={loading}
          className="mt-4 h-14 rounded-2xl flex-row gap-2"
        >
          <LogOut size={20} color="white" />
          <Text className="text-white font-bold text-base">Sign Out</Text>
        </Button>

        <Text className="text-center text-muted-foreground text-xs mt-4">
          Pausy v1.0.0 · Made with 🎀
        </Text>
      </View>
    </ScrollView>
  );
}
