import React, { useState } from "react";
import { View, KeyboardAvoidingView, Platform, ScrollView, TouchableOpacity, TextInput } from "react-native";
import { Stack, useRouter } from "expo-router";
import { supabase } from "@/lib/supabase";
import { useAppStore } from "@/lib/store";
import { Text } from "@/components/ui/text";

export default function SignUp() {
  const { showAlert } = useAppStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSignUp() {
    if (!email || !password) return;
    setLoading(true);

    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    });

    if (signUpError) {
      showAlert("Sign Up Failed", signUpError.message, "error");
      setLoading(false);
    } else {
      router.replace("/(tabs)");
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1 bg-[#EEEBDA]"
    >
      <Stack.Screen options={{ headerShown: false }} />

      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        className="px-6 pt-20 pb-12 z-10"
      >
        {/* Header */}
        <View className="mb-6">
          <Text className="text-5xl font-fancy text-[#282B4A]">Pausy</Text>
          <Text className="text-[13px] text-[#282B4A]/40 font-medium mt-2">Create an account — start spending intentionally.</Text>
        </View>

        {/* Sign Up Form */}
        <View className="space-y-4">
          {/* Full Name Input */}
          <View className="mb-4">
            <TextInput
              className="w-full h-14 bg-[#282B4A]/[0.07] border border-[#282B4A]/[0.15] rounded-2xl px-5 text-[#282B4A] text-base"
              placeholder="Full Name"
              placeholderTextColor="rgba(40,43,74,0.35)"
              value={fullName}
              onChangeText={setFullName}
            />
          </View>

          {/* Email Input */}
          <View className="mb-4">
            <TextInput
              className="w-full h-14 bg-[#282B4A]/[0.07] border border-[#282B4A]/[0.15] rounded-2xl px-5 text-[#282B4A] text-base"
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
            <TextInput
              className="w-full h-14 bg-[#282B4A]/[0.07] border border-[#282B4A]/[0.15] rounded-2xl px-5 text-[#282B4A] text-base"
              placeholder="••••••••"
              placeholderTextColor="rgba(40,43,74,0.35)"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
          </View>

          {/* Primary Action */}
          <TouchableOpacity
            className={`w-full h-[52px] bg-[#282B4A] rounded-2xl items-center justify-center mt-2 ${(loading || !email || !password) ? 'opacity-50' : 'opacity-100'}`}
            onPress={handleSignUp}
            disabled={loading || !email || !password}
            activeOpacity={0.85}
          >
            <Text className="text-[#EEEBDA] font-semibold text-[14px]">Create Account</Text>
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View className="mt-auto pt-8 flex-row justify-center">
          <Text className="text-[11px] text-[#282B4A]/50 font-medium">Already have an account? </Text>
          <TouchableOpacity onPress={() => router.push("/(auth)/sign-in")}>
            <Text className="text-[11px] text-[#282B4A] underline font-bold">Sign in</Text>
          </TouchableOpacity>
        </View>

        {/* Bottom Margin Safe Area */}
        <View className="h-8" />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
