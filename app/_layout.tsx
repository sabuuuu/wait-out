import '../global.css';
import { useEffect } from "react";
import { ThemeProvider } from "@react-navigation/native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import {
  useFonts,
  Outfit_400Regular,
  Outfit_500Medium,
  Outfit_600SemiBold,
  Outfit_700Bold,
  Outfit_800ExtraBold,
} from "@expo-google-fonts/outfit";
import { PlayfairDisplay_700Bold_Italic } from "@expo-google-fonts/playfair-display";
import * as SplashScreen from "expo-splash-screen";
import { PortalHost } from '@rn-primitives/portal';
import { useColorScheme } from 'nativewind';
import { NAV_THEME } from '@/lib/theme';
import { registerNotificationCategories, requestPermissions } from '@/lib/notifications';
import { supabase } from "@/lib/supabase";
import { useRouter } from "expo-router";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { CustomAlert } from '@/components/CustomAlert';

const queryClient = new QueryClient();

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const { colorScheme } = useColorScheme();
  const router = useRouter();
  const [loaded, error] = useFonts({
    Outfit_400Regular,
    Outfit_500Medium,
    Outfit_600SemiBold,
    Outfit_700Bold,
    Outfit_800ExtraBold,
    PlayfairDisplay_700Bold_Italic,
  });

  useEffect(() => {
    if (loaded || error) {
      SplashScreen.hideAsync();
    }
  }, [loaded, error]);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        router.replace("/(tabs)");
      } else {
        router.replace("/(auth)/sign-in");
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    requestPermissions();
    registerNotificationCategories();
  }, []);

  if (!loaded && !error) return null;

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider value={NAV_THEME[colorScheme ?? 'light']}>
        <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
        <Stack
          screenOptions={{
            headerBackTitle: 'Back',
            headerTitleStyle: {
              fontFamily: 'Outfit_700Bold',
            },
          }}
        >
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="(auth)/sign-in" options={{ headerShown: false }} />
          <Stack.Screen name="(auth)/sign-up" options={{ headerShown: false }} />
        </Stack>
        <PortalHost />
        <CustomAlert />
      </ThemeProvider>
    </QueryClientProvider>
  );
}
