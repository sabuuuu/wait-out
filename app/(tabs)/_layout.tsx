import React from "react";
import { Tabs } from "expo-router";
import { LayoutDashboard, List, PlusCircle, User, BarChart2 } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColorScheme } from "nativewind";
import { NAV_THEME } from "@/lib/theme";

export default function TabsLayout() {
  const { colorScheme } = useColorScheme();
  const insets = useSafeAreaInsets();
  const theme = NAV_THEME[colorScheme ?? 'light'];

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: "#282B4A",
        tabBarInactiveTintColor: "rgba(40,43,74,0.3)",
        tabBarStyle: {
          backgroundColor: "#EEEBDA",
          borderTopColor: "rgba(40,43,74,0.08)",
          height: 60 + insets.bottom,
          paddingBottom: insets.bottom + 10,
          paddingTop: 10,
        },
        headerStyle: {
          backgroundColor: "#EEEBDA",
        },
        headerTitleStyle: {
          fontFamily: "Outfit_700Bold",
          color: "#282B4A",
        },
        headerShadowVisible: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          headerShown: false,
          tabBarIcon: ({ color, size }) => <LayoutDashboard color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="items"
        options={{
          title: "Waiting List",
          headerShown: false,
          tabBarIcon: ({ color, size }) => <List color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="add"
        options={{
          title: "Add Item",
          headerShown: false,
          tabBarIcon: ({ color, size }) => <PlusCircle color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="stats"
        options={{
          title: "Stats",
          headerShown: false,
          tabBarIcon: ({ color, size }) => <BarChart2 color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "Settings",
          headerShown: false,
          tabBarIcon: ({ color, size }) => <User color={color} size={size} />,
        }}
      />
    </Tabs>
  );
}
