import React from "react";
import { View, Modal, TouchableOpacity, ScrollView } from "react-native";
import { Text } from "./ui/text";
import { useCollections } from "@/hooks/useCollections";
import { X, Check } from "lucide-react-native";

interface Props {
  visible: boolean;
  onClose: () => void;
  selectedId?: string;
  onSelect: (id: string) => void;
}

export function CollectionPickerModal({ visible, onClose, selectedId, onSelect }: Props) {
  const { collections } = useCollections();

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={onClose}
    >
      <TouchableOpacity 
        activeOpacity={1} 
        onPress={onClose}
        className="flex-1 bg-black/40 justify-end"
      >
        <View className="bg-[#EEEBDA] rounded-t-[40px] p-6 max-h-[70%]">
          <View className="flex-row items-center justify-between mb-6">
            <Text className="text-2xl font-fancy text-[#282B4A]">Select Collection</Text>
            <TouchableOpacity onPress={onClose} className="p-2">
              <X size={24} color="#282B4A" />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            <View className="gap-3">
              {collections.map((col) => (
                <TouchableOpacity
                  key={col.id}
                  onPress={() => {
                    onSelect(col.id);
                    onClose();
                  }}
                  className={`flex-row items-center justify-between p-5 rounded-3xl border ${
                    selectedId === col.id 
                      ? "bg-[#282B4A] border-[#282B4A]" 
                      : "bg-white border-[#282B4A]/5 shadow-sm"
                  }`}
                >
                  <View className="flex-row items-center gap-4">
                    <View className={`w-10 h-10 rounded-xl items-center justify-center ${selectedId === col.id ? "bg-white/10" : "bg-[#282B4A]/5"}`}>
                      <Text className="text-lg">{col.emoji}</Text>
                    </View>
                    <Text className={`font-bold text-lg ${selectedId === col.id ? "text-[#EEEBDA]" : "text-[#282B4A]"}`}>
                      {col.name}
                    </Text>
                  </View>
                  {selectedId === col.id && <Check size={20} color="#EEEBDA" />}
                </TouchableOpacity>
              ))}
              
              {collections.length === 0 && (
                <View className="py-10 items-center">
                  <Text className="text-[#282B4A]/40 font-medium">No collections found.</Text>
                  <Text className="text-[#282B4A]/40 text-xs mt-1">Create one in the Waiting Room settings.</Text>
                </View>
              )}
            </View>
            <View className="h-10" />
          </ScrollView>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}
