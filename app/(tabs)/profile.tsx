import React from "react";
import { View } from "react-native";
import { Text } from "@/components/ui/text";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";

export default function Profile() {
  async function handleSignOut() {
    await supabase.auth.signOut();
  }

  return (
    <View className="flex-1 items-center justify-center bg-background p-6">
      <Text className="text-2xl font-bold mb-4">Profile</Text>
      <Button onPress={handleSignOut} variant="destructive">
        <Text className="text-destructive-foreground">Sign Out</Text>
      </Button>
    </View>
  );
}
