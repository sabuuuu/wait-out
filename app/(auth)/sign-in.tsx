import React, { useState } from "react";
import { View, KeyboardAvoidingView, Platform, ScrollView, TouchableOpacity } from "react-native";
import { Stack, useRouter } from "expo-router";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Text } from "@/components/ui/text";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, Lock, ChevronRight, AlertCircle, Chrome } from "lucide-react-native";
import * as WebBrowser from "expo-web-browser";
import * as AuthSession from "expo-auth-session";
import { useAppStore } from "@/lib/store";

WebBrowser.maybeCompleteAuthSession();

export default function SignIn() {
  const { showAlert } = useAppStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSignIn() {
    if (!email || !password) return;
    setLoading(true);

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (signInError) {
      showAlert("Sign In Failed", signInError.message, "error");
    } else {
      router.replace("/(tabs)");
    }
    setLoading(false);
  }

  async function handleGoogleSignIn() {
    setLoading(true);
    try {
      const redirectUri = AuthSession.makeRedirectUri();
      const { data, error: googleError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: redirectUri,
          skipBrowserRedirect: true,
        }
      });

      if (googleError) throw googleError;
      if (!data?.url) throw new Error("No auth URL returned");

      const res = await WebBrowser.openAuthSessionAsync(data.url, redirectUri);

      if (res.type === 'success' && res.url) {
        const { error: sessionError } = await supabase.auth.setSession({
          access_token: new URL(res.url).searchParams.get('access_token') ?? '',
          refresh_token: new URL(res.url).searchParams.get('refresh_token') ?? '',
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
      className="flex-1 bg-background"
    >
      <Stack.Screen options={{ title: "Sign In", headerShown: false }} />
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} className="p-6">
        <View className="flex-1 justify-center">
          <View className="items-center mb-8">
            <View className="w-20 h-20 bg-primary/10 rounded-3xl items-center justify-center mb-4">
              <Lock size={40} color="hsl(var(--primary))" />
            </View>
            <Text className="text-3xl font-display text-foreground text-center">Pausy</Text>
            <Text className="text-muted-foreground text-center mt-2">Curb impulse spending today</Text>
          </View>

          <Card className="border-none shadow-none bg-card/50">
            <CardHeader>
              <CardTitle>Welcome Back</CardTitle>
              <CardDescription>Sign in to your account</CardDescription>
            </CardHeader>
            <CardContent className="gap-4">
              <View className="gap-2">
                <Label nativeID="email-label">Email</Label>
                <View className="relative">
                  <View className="absolute left-3 top-3 z-10">
                    <Mail size={18} className="text-muted-foreground" />
                  </View>
                  <Input
                    className="pl-10"
                    placeholder="name@example.com"
                    value={email}
                    onChangeText={setEmail}
                    autoCapitalize="none"
                    keyboardType="email-address"
                    aria-labelledby="email-label"
                  />
                </View>
              </View>

              <View className="gap-2">
                <Label nativeID="password-label">Password</Label>
                <View className="relative">
                  <View className="absolute left-3 top-3 z-10">
                    <Lock size={18} className="text-muted-foreground" />
                  </View>
                  <Input
                    className="pl-10"
                    placeholder="••••••••"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                    aria-labelledby="password-label"
                  />
                </View>
              </View>

              <Button
                onPress={handleSignIn}
                disabled={loading || !email || !password}
                className="mt-2"
              >
                <Text className="text-primary-foreground font-semibold">Sign In</Text>
                <ChevronRight size={18} className="text-primary-foreground ml-2" />
              </Button>

              <View className="flex-row items-center gap-4 my-2">
                <View className="flex-1 h-[1px] bg-border" />
                <Text className="text-muted-foreground text-xs uppercase">or continue with</Text>
                <View className="flex-1 h-[1px] bg-border" />
              </View>

              <Button
                variant="outline"
                onPress={handleGoogleSignIn}
                disabled={loading}
                className="flex-row gap-3"
              >
                <Chrome size={18} color="hsl(var(--foreground))" />
                <Text>Google</Text>
              </Button>
            </CardContent>
            <CardFooter className="justify-center">
              <TouchableOpacity onPress={() => router.push("/(auth)/sign-up")}>
                <Text className="text-sm text-muted-foreground">
                  Don't have an account? <Text className="text-primary font-semibold">Sign Up</Text>
                </Text>
              </TouchableOpacity>
            </CardFooter>
          </Card>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
