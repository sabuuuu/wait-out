import React from "react";
import { View, Modal, TouchableOpacity, Animated } from "react-native";
import { Text } from "./ui/text";
import { Button } from "./ui/button";
import { useAppStore } from "@/lib/store";
import { X, AlertCircle, CheckCircle2, Info } from "lucide-react-native";

export function CustomAlert() {
  const { alert, hideAlert } = useAppStore();

  if (!alert.visible) return null;

  const getIcon = () => {
    switch (alert.type) {
      case "error": return <AlertCircle size={32} className="text-destructive" />;
      case "success": return <CheckCircle2 size={32} className="text-primary" />;
      default: return <Info size={32} className="text-primary" />;
    }
  };

  return (
    <Modal
      transparent
      animationType="fade"
      visible={alert.visible}
      onRequestClose={hideAlert}
    >
      <View className="flex-1 bg-black/50 items-center justify-center p-6">
        <View className="bg-background w-full max-w-sm rounded-[32px] overflow-hidden shadow-2xl">
          {/* Accent bar */}
          <View className={`h-2 ${alert.type === 'error' ? 'bg-destructive' : 'bg-primary'}`} />
          
          <View className="p-8 items-center">
            <View className="mb-4 bg-muted p-3 rounded-2xl">
              {getIcon()}
            </View>
            
            <Text className="text-2xl font-display text-foreground text-center mb-2">
              {alert.title}
            </Text>
            
            <Text className="text-muted-foreground text-center leading-5 mb-8">
              {alert.message}
            </Text>
            
            <Button 
              onPress={hideAlert}
              className="w-full h-14 rounded-2xl bg-primary shadow-lg shadow-primary/20"
            >
              <Text className="text-primary-foreground font-bold text-lg">Got it!</Text>
            </Button>
          </View>
        </View>
      </View>
    </Modal>
  );
}
