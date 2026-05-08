import React, { useState } from "react";
import { View, Modal, TouchableOpacity, ScrollView, TextInput, Alert } from "react-native";
import { Text } from "./ui/text";
import { Button } from "./ui/button";
import { useCollections } from "@/hooks/useCollections";
import { X, Plus, Trash2, Edit2, Check, Smile } from "lucide-react-native";
import { Collection } from "@/lib/types";
import { supabase } from "@/lib/supabase";

interface Props {
  visible: boolean;
  onClose: () => void;
}

export function ManageCollectionsModal({ visible, onClose }: Props) {
  const { collections, addCollection, updateCollection, deleteCollection } = useCollections();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [emoji, setEmoji] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  const handleAdd = async () => {
    if (!name || !emoji) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    try {
      await addCollection({
        user_id: user.id,
        name,
        emoji,
        sort_order: collections.length,
      });
      setName("");
      setEmoji("");
      setIsAdding(false);
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpdate = async (id: string) => {
    if (!name || !emoji) return;
    try {
      await updateCollection({ id, name, emoji });
      setEditingId(null);
      setName("");
      setEmoji("");
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = (id: string, colName: string) => {
    Alert.alert(
      "Delete Collection",
      `Are you sure you want to delete "${colName}"? Items in this collection will be uncategorized.`,
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive", 
          onPress: () => deleteCollection(id) 
        },
      ]
    );
  };

  const startEdit = (col: Collection) => {
    setEditingId(col.id);
    setName(col.name);
    setEmoji(col.emoji);
    setIsAdding(false);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-[#EEEBDA]">
        <View className="flex-row items-center justify-between px-6 pt-6 pb-4">
          <Text className="text-2xl font-fancy text-[#282B4A]">Manage Collections</Text>
          <TouchableOpacity onPress={onClose} className="p-2">
            <X size={24} color="#282B4A" />
          </TouchableOpacity>
        </View>

        <ScrollView className="flex-1 px-6">
          <View className="gap-4 py-4">
            {collections.map((col) => (
              <View key={col.id} className="bg-white rounded-3xl p-4 flex-row items-center justify-between border border-[#282B4A]/5 shadow-sm">
                {editingId === col.id ? (
                  <View className="flex-1 flex-row gap-2 items-center">
                    <TextInput
                      value={emoji}
                      onChangeText={setEmoji}
                      className="w-10 h-10 bg-[#282B4A]/5 rounded-xl text-center text-lg"
                      maxLength={2}
                    />
                    <TextInput
                      value={name}
                      onChangeText={setName}
                      className="flex-1 h-10 bg-[#282B4A]/5 rounded-xl px-3 font-medium text-[#282B4A]"
                      autoFocus
                    />
                    <TouchableOpacity onPress={() => handleUpdate(col.id)} className="p-2 bg-[#282B4A] rounded-xl">
                      <Check size={20} color="#EEEBDA" />
                    </TouchableOpacity>
                  </View>
                ) : (
                  <>
                    <View className="flex-row items-center gap-3">
                      <View className="w-10 h-10 bg-[#282B4A]/5 rounded-xl items-center justify-center">
                        <Text className="text-lg">{col.emoji}</Text>
                      </View>
                      <Text className="font-bold text-[#282B4A]">{col.name}</Text>
                    </View>
                    <View className="flex-row gap-2">
                      <TouchableOpacity onPress={() => startEdit(col)} className="p-2">
                        <Edit2 size={18} color="rgba(40,43,74,0.4)" />
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => handleDelete(col.id, col.name)} className="p-2">
                        <Trash2 size={18} color="#ef4444" opacity={0.6} />
                      </TouchableOpacity>
                    </View>
                  </>
                )}
              </View>
            ))}

            {isAdding ? (
              <View className="bg-white rounded-3xl p-4 border-2 border-dashed border-[#282B4A]/20">
                <View className="flex-row gap-2 items-center">
                  <TextInput
                    placeholder="🏷️"
                    value={emoji}
                    onChangeText={setEmoji}
                    className="w-12 h-12 bg-[#282B4A]/5 rounded-xl text-center text-xl"
                    maxLength={2}
                  />
                  <TextInput
                    placeholder="New Collection Name"
                    value={name}
                    onChangeText={setName}
                    className="flex-1 h-12 bg-[#282B4A]/5 rounded-xl px-4 font-medium text-[#282B4A]"
                    autoFocus
                  />
                </View>
                <View className="flex-row justify-end gap-3 mt-4">
                  <Button variant="ghost" onPress={() => setIsAdding(false)}>
                    <Text>Cancel</Text>
                  </Button>
                  <Button onPress={handleAdd} disabled={!name || !emoji} className="bg-[#282B4A] px-6 rounded-xl">
                    <Text className="text-[#EEEBDA] font-bold">Create</Text>
                  </Button>
                </View>
              </View>
            ) : (
              <TouchableOpacity 
                onPress={() => { setIsAdding(true); setEditingId(null); setName(""); setEmoji(""); }}
                className="bg-[#282B4A]/5 rounded-3xl p-5 border-2 border-dashed border-[#282B4A]/10 items-center justify-center flex-row gap-2"
              >
                <Plus size={20} color="rgba(40,43,74,0.4)" />
                <Text className="font-bold text-[#282B4A]/40 uppercase tracking-widest text-xs">Add New Collection</Text>
              </TouchableOpacity>
            )}
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}
