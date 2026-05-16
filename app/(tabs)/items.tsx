import React, { useState, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { View, ScrollView, TouchableOpacity, FlatList, RefreshControl } from "react-native";
import Animated, { FadeInUp } from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Text } from "@/components/ui/text";
import { Card, CardContent } from "@/components/ui/card";
import { useAppStore } from "@/lib/store";
import { ItemStatus } from "@/lib/types";
import { Timer, ShoppingBag, Trash2, Ghost, ChevronRight, Filter, Settings2 } from "lucide-react-native";
import { useRouter } from "expo-router";
import { useItems } from "@/hooks/useItems";
import { useCollections } from "@/hooks/useCollections";
import { ManageCollectionsModal } from "@/components/ManageCollectionsModal";
import { getCategoryIcon } from "@/lib/utils";

const STATUS_FILTERS: { label: string; value: ItemStatus | "all" }[] = [
  { label: "Waiting", value: "waiting" },
  { label: "Bought", value: "bought" },
  { label: "Forgot", value: "forgot" },
  { label: "All", value: "all" },
];

export default function Items() {
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const { items, isLoading } = useItems();
  const { collections } = useCollections();
  const { activeCollectionId, setActiveCollection } = useAppStore();
  const [statusFilter, setStatusFilter] = useState<ItemStatus | "all">("waiting");
  const [isManageModalVisible, setIsManageModalVisible] = useState(false);
  const router = useRouter();

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchesStatus = statusFilter === "all" || item.status === statusFilter;
      const matchesCollection = !activeCollectionId || item.collection_id === activeCollectionId;
      return matchesStatus && matchesCollection;
    });
  }, [items, statusFilter, activeCollectionId]);

  return (
    <View className="flex-1 bg-[#EEEBDA]" style={{ paddingTop: Math.max(insets.top, 20) }}>
      {/* Header */}
      <View className="px-6 pt-10 pb-4 flex-row items-center justify-between">
        <View>
          <Text className="text-4xl font-fancy text-[#282B4A]">Waiting Room</Text>
          <Text className="text-[13px] text-[#282B4A]/40 font-medium mt-2">Manage your intentional purchases.</Text>
        </View>
        <TouchableOpacity
          onPress={() => setIsManageModalVisible(true)}
          className="p-3 bg-white rounded-2xl border border-[#282B4A]/5 shadow-sm"
        >
          <Settings2 size={20} color="#282B4A" opacity={0.6} />
        </TouchableOpacity>
      </View>

      {/* Collection Selector */}
      <View className="pt-4 pb-2">
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 24 }}
        >
          {collections.map((col) => (
            <TouchableOpacity
              key={col.id}
              onPress={() => setActiveCollection(col.id)}
              className={`px-4 py-2 rounded-full space-x-2 mr-2 flex-row items-center ${activeCollectionId === col.id ? 'bg-[#282B4A]' : 'bg-[#282B4A]/5'}`}
            >
              {(() => {
                const Icon = getCategoryIcon(col.name);
                return <Icon size={12} color={activeCollectionId === col.id ? "#EEEBDA" : "rgba(40,43,74,0.4)"} className="mr-2" />;
              })()}
              <Text className={`font-outfit-bold text-xs uppercase tracking-widest ${activeCollectionId === col.id ? 'text-[#EEEBDA]' : 'text-[#282B4A]/50'}`}>
                {col.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Status Filter */}
        <View className="flex-row px-6 mt-4 mb-2 gap-2">
          {STATUS_FILTERS.map((filter) => {
            const isActive = statusFilter === filter.value;
            return (
              <TouchableOpacity
                key={filter.value}
                onPress={() => setStatusFilter(filter.value)}
                className={`flex-1 py-2.5 rounded-xl items-center border ${isActive ? 'bg-[#282B4A] border-[#282B4A]' : 'bg-[#282B4A]/5 border-transparent'}`}
              >
                <Text
                  className={`text-[10px] font-outfit-bold uppercase tracking-widest ${isActive ? 'text-[#EEEBDA]' : 'text-[#282B4A]/40'}`}
                >
                  {filter.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <ManageCollectionsModal
        visible={isManageModalVisible}
        onClose={() => setIsManageModalVisible(false)}
      />

      <FlatList
        data={filteredItems}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={() => queryClient.invalidateQueries({ queryKey: ["items"] })}
            tintColor="#F2C4CE"
          />
        }
        contentContainerStyle={{ padding: 24, paddingBottom: Math.max(insets.bottom, 20) + 100 }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View className="items-center justify-center pt-20">
            <View className="bg-[#282B4A]/5 w-20 h-20 rounded-full items-center justify-center mb-4">
              <Ghost size={32} color="rgba(40,43,74,0.3)" />
            </View>
            <Text className="text-[#282B4A]/40 font-medium">Nothing here yet...</Text>
            <TouchableOpacity
              onPress={() => router.push("/(tabs)/add")}
              className="mt-4"
            >
              <Text className="text-[#282B4A] font-bold">Add your first item</Text>
            </TouchableOpacity>
          </View>
        }
        renderItem={({ item, index }) => (
          <Animated.View entering={FadeInUp.delay(index * 50).springify()}>
            <TouchableOpacity
              onPress={() => {
                Haptics.selectionAsync();
                router.push({ pathname: "/item/[id]", params: { id: item.id } });
              }}
              activeOpacity={0.7}
              className="mb-4"
            >
              <View className="bg-white rounded-[32px] p-4 flex-row items-center border border-[#282B4A]/[0.03] shadow-sm">
                <View className="w-20 h-20 bg-[#282B4A]/[0.04] rounded-2xl items-center justify-center mr-4">
                  {item.status === 'waiting' && <Timer size={24} color="rgba(40,43,74,0.6)" />}
                  {item.status === 'bought' && <ShoppingBag size={24} color="#10b981" />}
                  {item.status === 'forgot' && <Ghost size={24} color="rgba(40,43,74,0.3)" />}
                </View>
                <View className="flex-1 justify-center">
                  <View>
                    <Text numberOfLines={1} className="text-[#282B4A] font-bold text-base">{item.title}</Text>
                    <Text className="text-[#282B4A]/40 text-[10px] uppercase font-bold tracking-wider mt-1">
                      {item.delay_type} • {new Date(item.added_at).toLocaleDateString()}
                    </Text>
                  </View>
                  <View className="flex-row justify-between items-center mt-2">
                    <Text className="text-[#282B4A] font-bold text-lg">
                      {item.price?.toLocaleString()} <Text className="text-xs text-[#282B4A]/50">{item.currency}</Text>
                    </Text>
                    <ChevronRight size={18} color="rgba(40,43,74,0.3)" />
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          </Animated.View>
        )}
      />
    </View>
  );
}

