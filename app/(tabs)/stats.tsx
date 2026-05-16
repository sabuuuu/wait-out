import React, { useMemo } from "react";
import { View, ScrollView, TouchableOpacity } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Text } from "@/components/ui/text";
import { useItems } from "@/hooks/useItems";
import { useCollections } from "@/hooks/useCollections";
import { useProfile } from "@/hooks/useProfile";
import { useRouter } from "expo-router";
import { Wallet, BrainCircuit, TrendingDown, ShoppingBag, AlertCircle } from "lucide-react-native";
import { getCategoryIcon } from "@/lib/utils";

export default function StatsScreen() {
  const insets = useSafeAreaInsets();
  const { items } = useItems();
  const { collections } = useCollections();
  const { profile } = useProfile();
  const currency = profile?.currency ?? "DZD";
  const router = useRouter();

  // 1. Total Money Not Spent (Forgot Items)
  const savedAmount = useMemo(() => {
    return items
      .filter(i => i.status === 'forgot')
      .reduce((sum, item) => sum + (item.price || 0), 0);
  }, [items]);

  // 2. Average Regret Score
  const avgRegret = useMemo(() => {
    const resolvedItems = items.filter(i => i.status === 'bought' || i.status === 'forgot');
    if (resolvedItems.length === 0) return 0;
    const totalRegret = resolvedItems.reduce((sum, item) => sum + item.regret_score, 0);
    return Math.round(totalRegret / resolvedItems.length);
  }, [items]);

  // 3. Collection Breakdown (Impulse Buy % = bought / (bought + forgot))
  const collectionStats = useMemo(() => {
    return collections.map(col => {
      const colItems = items.filter(i => i.collection_id === col.id && (i.status === 'bought' || i.status === 'forgot'));
      const total = colItems.length;
      const bought = colItems.filter(i => i.status === 'bought').length;
      const impulsePercent = total > 0 ? Math.round((bought / total) * 100) : 0;

      return {
        ...col,
        total,
        impulsePercent
      };
    }).sort((a, b) => b.impulsePercent - a.impulsePercent); // Sort by highest impulse %
  }, [collections, items]);

  // 4. "Bought anyway" list
  const boughtItems = useMemo(() => {
    return items.filter(i => i.status === 'bought').sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
  }, [items]);

  return (
    <ScrollView
      className="flex-1 bg-[#EEEBDA]"
      contentContainerStyle={{
        paddingTop: Math.max(insets.top, 20),
        paddingBottom: Math.max(insets.bottom, 20) + 100
      }}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View className="px-6 pt-10 pb-6">
        <Text className="text-4xl font-fancy text-[#282B4A]">Insights</Text>
        <Text className="text-[13px] text-[#282B4A]/50 font-medium mt-2">Understand your spending habits.</Text>
      </View>

      <View className="px-6 gap-6">
        {/* Top Cards Row */}
        <View className="flex-row gap-4">
          <View className="flex-1 bg-[#282B4A] rounded-3xl p-5 shadow-sm">
            <View className="flex-row items-center gap-2 mb-3">
              <Wallet size={16} color="#EEEBDA" opacity={0.6} />
              <Text className="text-[10px] text-[#EEEBDA]/70 font-bold uppercase tracking-wider">Money Saved</Text>
            </View>
            <Text className="text-[#EEEBDA] text-2xl font-bold">{savedAmount.toLocaleString()} <Text className="text-sm font-medium opacity-60">{currency}</Text></Text>
          </View>

          <View className="flex-1 bg-white rounded-3xl p-5 border border-[#282B4A]/[0.05] shadow-sm">
            <View className="flex-row items-center gap-2 mb-3">
              <BrainCircuit size={16} color="#282B4A" opacity={0.5} />
              <Text className="text-[10px] text-[#282B4A]/50 font-bold uppercase tracking-wider">Avg Regret</Text>
            </View>
            <Text className="text-[#282B4A] text-2xl font-bold">{avgRegret}%</Text>
          </View>
        </View>

        {/* Collection Breakdown */}
        <View className="bg-white rounded-[32px] p-6 border border-[#282B4A]/[0.05] shadow-sm">
          <View className="flex-row items-center gap-2 mb-5">
            <TrendingDown size={18} color="#282B4A" opacity={0.6} />
            <Text className="text-lg font-bold text-[#282B4A]">Impulse Rate by Category</Text>
          </View>

          {collectionStats.length === 0 ? (
            <Text className="text-sm text-[#282B4A]/50 italic">No collections yet.</Text>
          ) : (
            <View className="gap-4">
              {collectionStats.map(stat => (
                <View key={stat.id}>
                  <View className="flex-row justify-between mb-1.5">
                    <View className="flex-row items-center gap-2">
                      {(() => {
                        const Icon = getCategoryIcon(stat.name);
                        return <Icon size={14} color="#282B4A" opacity={0.6} />;
                      })()}
                      <Text className="text-sm font-bold text-[#282B4A]">{stat.name}</Text>
                    </View>
                    <Text className="text-xs font-bold text-[#282B4A]/60">{stat.impulsePercent}%</Text>
                  </View>
                  <View className="h-2 w-full bg-[#282B4A]/[0.05] rounded-full overflow-hidden">
                    <View 
                      className="h-full rounded-full" 
                      style={{ 
                        width: `${stat.impulsePercent}%`,
                        backgroundColor: stat.impulsePercent > 50 ? '#ef4444' : stat.impulsePercent > 20 ? '#f59e0b' : '#10b981'
                      }} 
                    />
                  </View>
                  <Text className="text-[10px] text-[#282B4A]/40 mt-1">{stat.total} items resolved</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Bought Anyway List */}
        <View className="mb-4">
          <View className="flex-row items-center gap-2 mb-4 px-1">
            <ShoppingBag size={18} color="#282B4A" opacity={0.6} />
            <Text className="text-lg font-bold text-[#282B4A]">Bought Anyway</Text>
          </View>

          {boughtItems.length === 0 ? (
            <Text className="text-sm text-[#282B4A]/50 italic px-1">You haven't bought any items from your waitlist yet.</Text>
          ) : (
            <View className="gap-3">
              {boughtItems.map(item => (
                <TouchableOpacity 
                  key={item.id} 
                  activeOpacity={0.8}
                  onPress={() => router.push({ pathname: "/item/[id]", params: { id: item.id } })}
                  className="bg-white rounded-3xl p-4 flex-row items-center border border-[#282B4A]/[0.05] shadow-sm"
                >
                  <View className="w-10 h-10 rounded-full bg-[#282B4A]/5 items-center justify-center mr-3">
                    <Text className="text-[10px] font-bold text-[#282B4A]/50">{currency}</Text>
                  </View>
                  <View className="flex-1 pr-2">
                    <Text className="font-bold text-[#282B4A] text-sm" numberOfLines={1}>{item.title}</Text>
                    <Text className="text-[11px] text-[#282B4A]/50 font-medium">{item.price?.toLocaleString()} {currency}</Text>
                  </View>
                  <View className={`px-2.5 py-1 rounded-full flex-row items-center gap-1 ${item.regret_score > 50 ? 'bg-[#ef4444]/10' : 'bg-[#f59e0b]/10'}`}>
                    <AlertCircle size={10} color={item.regret_score > 50 ? "#ef4444" : "#f59e0b"} />
                    <Text className={`text-[10px] font-bold ${item.regret_score > 50 ? 'text-[#ef4444]' : 'text-[#f59e0b]'}`}>{item.regret_score}% Regret</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

      </View>
    </ScrollView>
  );
}
