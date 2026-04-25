import React, { useState } from "react";
import { View, KeyboardAvoidingView, Platform, ScrollView, TouchableOpacity } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Stack, useRouter } from "expo-router";
import { supabase } from "@/lib/supabase";
import { Chrome } from "lucide-react-native";
import * as WebBrowser from "expo-web-browser";
import * as AuthSession from "expo-auth-session";
import { useAppStore } from "@/lib/store";
import { Text } from "@/components/ui/text";
import { Input } from "@/components/ui/input";

WebBrowser.maybeCompleteAuthSession();

// Colors mapping to match design-ex.md
const INDIGO = "#282B4A";
const PARCHMENT = "#EEEBDA";

export default function SignIn() {
  const insets = useSafeAreaInsets();
  const { showAlert } = useAppStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSignIn() {
    if (!email || !password) return;
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) showAlert("Sign In Failed", error.message, "error");
    else router.replace("/(tabs)");
    setLoading(false);
  }

  async function handleGoogleSignIn() {
    setLoading(true);
    try {
      const redirectUri = AuthSession.makeRedirectUri();
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: redirectUri, skipBrowserRedirect: true },
      });
      if (error) throw error;
      if (!data?.url) throw new Error("No auth URL returned");
      const res = await WebBrowser.openAuthSessionAsync(data.url, redirectUri);
      if (res.type === "success" && res.url) {
        const url = new URL(res.url);
        const { error: sessionError } = await supabase.auth.setSession({
          access_token: url.searchParams.get("access_token") ?? "",
          refresh_token: url.searchParams.get("refresh_token") ?? "",
        });
        if (sessionError) throw sessionError;
        router.replace("/(tabs)");
      }
    } catch (e: any) {
      showAlert("Google Sign In Error", e.message, "error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1 bg-[#EEEBDA]"
    >
      <Stack.Screen options={{ headerShown: false }} />

      <ScrollView
        contentContainerStyle={{ 
          flexGrow: 1,
          paddingTop: Math.max(insets.top, 60),
          paddingBottom: Math.max(insets.bottom, 20)
        }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        className="px-6 z-10"
      >
        {/* Header */}
        <View className="mb-6">
          <Text className="text-5xl font-fancy text-[#282B4A]">Pausy</Text>
          <Text className="text-[13px] text-[#282B4A]/40 font-medium mt-2">Welcome back — your waiting room is ready.</Text>
        </View>

        {/* Login Form */}
        <View className="space-y-4">
          {/* Email Input */}
          <View className="mb-4">
            <Input
              className="w-full h-14 bg-[#282B4A]/[0.07] border border-[#282B4A]/[0.15] rounded-2xl px-5 text-[#282B4A] text-base font-sans"
              placeholder="you@example.com"
              placeholderTextColor="rgba(40,43,74,0.35)"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />
          </View>

          {/* Password Input */}
          <View className="mb-4">
            <Input
              className="w-full h-14 bg-[#282B4A]/[0.07] border border-[#282B4A]/[0.15] rounded-2xl px-5 text-[#282B4A] text-base font-sans"
              placeholder="••••••••"
              placeholderTextColor="rgba(40,43,74,0.35)"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
          </View>

          {/* Forgot Password */}
          <View className="flex-row justify-end mb-4">
            <TouchableOpacity>
              <Text className="text-[11px] text-[#282B4A]/45 underline font-medium">Forgot password?</Text>
            </TouchableOpacity>
          </View>

          {/* Primary Action */}
          <TouchableOpacity
            className={`w-full h-[52px] bg-[#282B4A] rounded-2xl items-center justify-center ${(loading || !email || !password) ? 'opacity-50' : 'opacity-100'}`}
            onPress={handleSignIn}
            disabled={loading || !email || !password}
            activeOpacity={0.85}
          >
            <Text className="text-[#EEEBDA] font-semibold text-[14px]">Sign in</Text>
          </TouchableOpacity>
        </View>

        {/* Divider */}
        <View className="flex-row items-center my-6">
          <View className="flex-1 h-[1px] bg-[#282B4A]/10" />
          <Text className="px-4 text-[11px] text-[#282B4A]/30 font-medium uppercase tracking-widest">or</Text>
          <View className="flex-1 h-[1px] bg-[#282B4A]/10" />
        </View>

        {/* Social Auth */}
        <TouchableOpacity
          className="w-full h-[52px] border border-[#282B4A]/[0.2] bg-transparent rounded-2xl flex-row items-center justify-center gap-3"
          onPress={handleGoogleSignIn}
          disabled={loading}
          activeOpacity={0.75}
        >
          <Chrome size={20} color={INDIGO} />
          <Text className="text-[#282B4A] font-semibold text-[14px]">Continue with Google</Text>
        </TouchableOpacity>

        {/* Footer */}
        <View className="mt-auto pt-8 flex-row justify-center">
          <Text className="text-[11px] text-[#282B4A]/50 font-medium">Don't have an account? </Text>
          <TouchableOpacity onPress={() => router.push("/(auth)/sign-up")}>
            <Text className="text-[11px] text-[#282B4A] underline font-bold">Sign up</Text>
          </TouchableOpacity>
        </View>

        {/* Bottom Margin Safe Area */}
        <View className="h-8" />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}