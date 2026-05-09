import '../global.css';
import { useEffect, useRef } from "react";
import { AppState, Alert } from "react-native";
import * as Clipboard from "expo-clipboard";
import { useShareIntent } from "expo-share-intent";
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
import { setupShareHandler } from "@/lib/share-handler";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { CustomAlert } from '@/components/CustomAlert';
import { OfflineBanner } from '@/components/OfflineBanner';

const queryClient = new QueryClient();

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const { colorScheme } = useColorScheme();
  const router = useRouter();
  const { hasShareIntent, shareIntent, resetShareIntent, error: shareIntentError } = useShareIntent();
  const lastClipboard = useRef<string | null>(null);
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
    setupShareHandler();
  }, []);

  useEffect(() => {
    const sharedContent = shareIntent.webUrl || shareIntent.text;
    if (hasShareIntent && sharedContent) {
      router.push({
        pathname: "/(tabs)/add",
        params: { url: sharedContent }
      });
      resetShareIntent();
    }
  }, [hasShareIntent, shareIntent, router, resetShareIntent]);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", async (state) => {
      if (state === "active") {
        try {
          const text = await Clipboard.getStringAsync();
          if (text && text.startsWith("http") && text !== lastClipboard.current) {
            lastClipboard.current = text;
            Alert.alert(
              "Link Detected 🎀",
              "We found a link in your clipboard. Add it to your waiting list?",
              [
                { text: "Ignore", style: "cancel" },
                { 
                  text: "Add Item", 
                  style: "default",
                  onPress: () => router.push({
                    pathname: "/(tabs)/add",
                    params: { url: text }
                  })
                }
              ]
            );
          }
        } catch (e) {
          // Ignore clipboard errors
        }
      }
    });
    return () => subscription.remove();
  }, [router]);

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
        <OfflineBanner />
      </ThemeProvider>
    </QueryClientProvider>
  );
}
