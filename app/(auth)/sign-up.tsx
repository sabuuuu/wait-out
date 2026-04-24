import React, { useState } from "react";
import { View, KeyboardAvoidingView, Platform, ScrollView, TouchableOpacity } from "react-native";
import { Stack, useRouter } from "expo-router";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Text } from "@/components/ui/text";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, Lock, User, ChevronRight, AlertCircle } from "lucide-react-native";

export default function SignUp() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function handleSignUp() {
    if (!email || !password) return;
    setLoading(true);
    setError(null);

    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    });

    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
    } else {
      router.replace("/(tabs)");
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1 bg-background"
    >
      <Stack.Screen options={{ title: "Sign Up", headerShown: false }} />
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} className="p-6">
        <View className="flex-1 justify-center">
          <View className="items-center mb-8">
            <View className="w-20 h-20 bg-primary/10 rounded-3xl items-center justify-center mb-4">
              <User size={40} color="hsl(var(--primary))" />
            </View>
            <Text className="text-3xl font-display text-foreground text-center">Create Account</Text>
            <Text className="text-muted-foreground text-center mt-2">Start your journey to intentional spending</Text>
          </View>

          <Card className="border-none shadow-none bg-card/50">
            <CardHeader>
              <CardTitle>Get Started</CardTitle>
              <CardDescription>Enter your details to create an account</CardDescription>
            </CardHeader>
            <CardContent className="gap-4">
              <View className="gap-2">
                <Label nativeID="name-label">Full Name</Label>
                <View className="relative">
                  <View className="absolute left-3 top-3 z-10">
                    <User size={18} className="text-muted-foreground" />
                  </View>
                  <Input
                    className="pl-10"
                    placeholder="Jane Doe"
                    value={fullName}
                    onChangeText={setFullName}
                    aria-labelledby="name-label"
                  />
                </View>
              </View>

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

              {error && (
                <View className="flex-row items-center gap-2 bg-destructive/10 p-3 rounded-xl border border-destructive/20">
                  <AlertCircle size={16} className="text-destructive" />
                  <Text className="text-destructive text-sm flex-1">{error}</Text>
                </View>
              )}

              <Button
                onPress={handleSignUp}
                disabled={loading || !email || !password}
                className="mt-2"
              >
                <Text className="text-primary-foreground font-semibold">Create Account</Text>
                <ChevronRight size={18} className="text-primary-foreground ml-2" />
              </Button>
            </CardContent>
            <CardFooter className="justify-center">
              <TouchableOpacity onPress={() => router.push("/(auth)/sign-in")}>
                <Text className="text-sm text-muted-foreground">
                  Already have an account? <Text className="text-primary font-semibold">Sign In</Text>
                </Text>
              </TouchableOpacity>
            </CardFooter>
          </Card>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
