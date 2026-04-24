import React, { useState, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { View, ScrollView, TouchableOpacity, FlatList } from "react-native";
import { Text } from "@/components/ui/text";
import { Card, CardContent } from "@/components/ui/card";
import { useAppStore } from "@/lib/store";
import { ItemStatus } from "@/lib/types";
import { Timer, ShoppingBag, Trash2, Ghost, ChevronRight, Filter } from "lucide-react-native";
import { useRouter } from "expo-router";
import { useItems } from "@/hooks/useItems";
import { useCollections } from "@/hooks/useCollections";

const STATUS_FILTERS: { label: string; value: ItemStatus | "all" }[] = [
  { label: "Waiting", value: "waiting" },
  { label: "Bought", value: "bought" },
  { label: "Forgot", value: "forgot" },
  { label: "All", value: "all" },
];

export default function Items() {
  const queryClient = useQueryClient();
  const { items, isLoading } = useItems();
  const { collections } = useCollections();
  const { activeCollectionId, setActiveCollection } = useAppStore();
  const [statusFilter, setStatusFilter] = useState<ItemStatus | "all">("waiting");
  const router = useRouter();

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchesStatus = statusFilter === "all" || item.status === statusFilter;
      const matchesCollection = !activeCollectionId || item.collection_id === activeCollectionId;
      return matchesStatus && matchesCollection;
    });
  }, [items, statusFilter, activeCollectionId]);

  return (
    <View className="flex-1 bg-background">
      {/* Collection Selector */}
      <View className="bg-card pt-4 pb-2 border-b border-border">
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16 }}
        >
          <TouchableOpacity 
            onPress={() => setActiveCollection(null)}
            className={`px-4 py-2 rounded-full mr-2 ${!activeCollectionId ? 'bg-primary' : 'bg-muted'}`}
          >
            <Text className={`font-bold ${!activeCollectionId ? 'text-primary-foreground' : 'text-muted-foreground'}`}>
              All Collections
            </Text>
          </TouchableOpacity>
          {collections.map((col) => (
            <TouchableOpacity 
              key={col.id}
              onPress={() => setActiveCollection(col.id)}
              className={`px-4 py-2 rounded-full mr-2 flex-row items-center ${activeCollectionId === col.id ? 'bg-primary' : 'bg-muted'}`}
            >
              <Text className="mr-2 text-base">{col.emoji}</Text>
              <Text className={`font-bold ${activeCollectionId === col.id ? 'text-primary-foreground' : 'text-muted-foreground'}`}>
                {col.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Status Filter */}
        <View className="flex-row px-4 mt-4 mb-2 gap-2">
          {STATUS_FILTERS.map((filter) => (
            <TouchableOpacity 
              key={filter.value}
              onPress={() => setStatusFilter(filter.value)}
              className={`flex-1 py-2 rounded-xl items-center border ${statusFilter === filter.value ? 'bg-blush-100 border-blush-300' : 'bg-transparent border-transparent'}`}
            >
              <Text className={`text-xs font-bold ${statusFilter === filter.value ? 'text-primary' : 'text-muted-foreground'}`}>
                {filter.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Items List */}
      <FlatList
        data={filteredItems}
        keyExtractor={(item) => item.id}
        refreshing={isLoading}
        onRefresh={() => queryClient.invalidateQueries({ queryKey: ["items"] })}
        contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
        ListEmptyComponent={
          <View className="items-center justify-center pt-20">
            <View className="bg-muted w-20 h-20 rounded-full items-center justify-center mb-4">
              <Ghost size={40} className="text-muted-foreground" />
            </View>
            <Text className="text-muted-foreground font-medium">Nothing here yet...</Text>
            <TouchableOpacity 
              onPress={() => router.push("/(tabs)/add")}
              className="mt-4"
            >
              <Text className="text-primary font-bold">Add your first item</Text>
            </TouchableOpacity>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity 
            onPress={() => router.push({ pathname: "/item/[id]", params: { id: item.id } })}
            activeOpacity={0.7}
            className="mb-4"
          >
            <Card className="border-none shadow-sm overflow-hidden">
              <View className="flex-row">
                <View className="w-24 h-24 bg-muted items-center justify-center">
                  {item.status === 'waiting' && <Timer size={30} className="text-primary" />}
                  {item.status === 'bought' && <ShoppingBag size={30} className="text-navy-300" />}
                  {item.status === 'forgot' && <Ghost size={30} className="text-muted-foreground" />}
                </View>
                <View className="flex-1 p-3 justify-between">
                  <View>
                    <Text numberOfLines={1} className="text-navy-500 font-bold text-base">{item.title}</Text>
                    <Text className="text-muted-foreground text-xs mt-0.5">
                      Added {new Date(item.added_at).toLocaleDateString()}
                    </Text>
                  </View>
                  <View className="flex-row justify-between items-center">
                    <Text className="text-primary font-bold text-lg">{item.currency}{item.price}</Text>
                    <View className="bg-muted px-2 py-1 rounded-lg">
                      <Text className="text-[10px] font-bold text-muted-foreground uppercase">{item.delay_type}</Text>
                    </View>
                  </View>
                </View>
                <View className="px-2 justify-center">
                  <ChevronRight size={20} className="text-muted-foreground" />
                </View>
              </View>
              {/* Progress bar for waiting items */}
              {item.status === 'waiting' && (
                <View className="h-1 bg-muted w-full">
                  <View className="h-1 bg-primary w-1/3" />
                </View>
              )}
            </Card>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}
