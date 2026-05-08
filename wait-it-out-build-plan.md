# 🎀 Pausy — Build Plan

> Midnight meets bone. Impulse meets patience. A cute little app that saves you from yourself.
> **Colors:** `#EEEBDA` (bone cream) · `#282B4A` (midnight blue)

---

## Phase 0 — Project Setup & Configuration [x]

### 0.1 Init the Expo app [x]

```bash
npx create-expo-app@latest pausy --template blank-typescript
cd pausy
```

### 0.2 Install core dependencies [x]

```bash
# Navigation
npx expo install expo-router expo-linking expo-constants expo-status-bar

# NativeWind v4 + Tailwind
npm install nativewind@^4.0.1
npm install --save-dev tailwindcss@3.4.0

# Native Reusables (component library)
npx @react-native-reusables/cli@latest init

# Notifications
npx expo install expo-notifications expo-device

# Supabase
npm install @supabase/supabase-js
npx expo install expo-secure-store   # used as Supabase auth storage adapter

# State (local cache layer on top of Supabase)
npm install zustand
npm install --save-dev immer

# Date handling
npm install date-fns

# Icons
npx expo install @expo/vector-icons

# Image picking (screenshots & gallery)
npx expo install expo-image-picker expo-image-manipulator

# Haptics
npx expo install expo-haptics

# Share / clipboard (link capture from other apps)
npx expo install expo-sharing expo-clipboard

# Unique IDs
npm install nanoid

# Auth (Google)
npx expo install expo-auth-session expo-crypto
```

### 0.4 Load fonts (Outfit) [x]

```bash
npx expo install expo-font @expo-google-fonts/outfit
```

```tsx
// app/_layout.tsx
import {
  useFonts,
  Outfit_400Regular,
  Outfit_500Medium,
  Outfit_600SemiBold,
  Outfit_700Bold,
  Outfit_800ExtraBold,
} from "@expo-google-fonts/outfit";
```

### 0.5 Configure Native Reusables theme [x]

```ts
// lib/theme.ts
export const NAV_THEME = {
  light: {
    background:   "hsl(340 60% 98%)",
    border:       "hsl(340 30% 88%)",
    card:         "hsl(0 0% 100%)",
    notification: "hsl(340 50% 70%)",
    primary:      "hsl(217 87% 15%)",
    text:         "hsl(217 87% 15%)",
  },
  dark: {
    background:   "hsl(217 87% 8%)",
    border:       "hsl(217 40% 20%)",
    card:         "hsl(217 87% 12%)",
    notification: "hsl(340 50% 60%)",
    primary:      "hsl(340 60% 80%)",
    text:         "hsl(340 60% 95%)",
  },
};
```

### 0.6 Supabase project setup [x]

1. Create a project at [supabase.com](https://supabase.com)
2. Copy your `SUPABASE_URL` and `SUPABASE_ANON_KEY`
3. Store them in `.env` (and `app.config.ts` for Expo)

```ts
// lib/supabase.ts
import { createClient } from "@supabase/supabase-js";
import * as SecureStore from "expo-secure-store";

const ExpoSecureStoreAdapter = {
  getItem:    (key: string) => SecureStore.getItemAsync(key),
  setItem:    (key: string, value: string) => SecureStore.setItemAsync(key, value),
  removeItem: (key: string) => SecureStore.deleteItemAsync(key),
};

export const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL!,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      storage:          ExpoSecureStoreAdapter,
      autoRefreshToken: true,
      persistSession:   true,
      detectSessionInUrl: true, // Needed for Google Auth redirect
    },
  }
);
```

---

## Phase 0.7 — Database Schema (Drizzle ORM) [x]

We use **Drizzle ORM** to manage our Supabase PostgreSQL schema. This gives us type safety across the app and easy migrations.

### Schema Definition (`db/schema.ts`)
The schema defines `profiles`, `collections`, `items`, and `notification_prefs`. It also links to Supabase's `auth.users` for RLS.

### How to apply changes:
1.  Set `DATABASE_URL` in your `.env` (use the Transaction connection string from Supabase).
2.  Generate migrations: `npx drizzle-kit generate`
3.  Push to Supabase: `npx drizzle-kit push`

> [!IMPORTANT]
> After pushing the schema, you still need to manually enable **RLS (Row Level Security)** and add **Storage Policies** in the Supabase Dashboard, as Drizzle Kit does not yet manage RLS policies or Storage buckets.

### Manual SQL for RLS & Storage (Dashboard)
Run this in the Supabase SQL Editor:
```sql
-- Storage bucket for item images
insert into storage.buckets (id, name, public) values ('item-images', 'item-images', false);

create policy "users upload own images"
  on storage.objects for insert
  with check (bucket_id = 'item-images' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "users read own images"
  on storage.objects for select
  using (bucket_id = 'item-images' and auth.uid()::text = (storage.foldername(name))[1]);
```

---

## Phase 0.8 — Folder Structure [x]

```
pausy/
├── app/
│   ├── _layout.tsx                  # Root layout — fonts, theme, nav, auth gate
│   ├── index.tsx                    # Redirect → onboarding or tabs
│   ├── (auth)/
│   │   ├── sign-in.tsx
│   │   └── sign-up.tsx
│   ├── (tabs)/
│   │   ├── _layout.tsx              # Bottom tab navigator
│   │   ├── waiting.tsx              # 🎀 Main wishlist (filterable by collection)
│   │   ├── stats.tsx                # 📊 Savings & regret stats
│   │   └── settings.tsx            # ⚙️  Profile, notifications, collections
│   ├── add-item.tsx                 # Sheet: add item with rich fields
│   ├── item/[id].tsx                # Item detail + regret score + image
│   ├── collection/[id].tsx          # Collection view + notification settings
│   └── collections/manage.tsx       # Create / edit / reorder collections
│
├── components/
│   ├── ui/
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── badge.tsx
│   │   ├── bottom-sheet.tsx
│   │   ├── progress.tsx
│   │   └── text.tsx
│   ├── WishlistItem.tsx             # Card: thumbnail, title, source badges, timer
│   ├── RegretScore.tsx              # Score card with factor breakdown
│   ├── DelayPicker.tsx              # Chip row + custom date option
│   ├── CollectionPicker.tsx         # Horizontal pill row to pick / filter collection
│   ├── SourceLinkInput.tsx          # TikTok / Insta / URL input with auto-detection
│   ├── ImagePickerCard.tsx          # Screenshot upload + preview
│   ├── SavingsBanner.tsx
│   └── EmptyState.tsx
│
├── lib/
│   ├── supabase.ts                  # Supabase client
│   ├── store.ts                     # Zustand — local optimistic cache
│   ├── items.ts                     # CRUD helpers for items (wraps Supabase)
│   ├── collections.ts               # CRUD helpers for collections
│   ├── images.ts                    # Upload / delete / getUrl for item images
│   ├── notifications.ts             # Schedule / cancel / prefs
│   ├── regret-score.ts              # Scoring algorithm
│   ├── theme.ts
│   └── utils.ts
│
├── hooks/
│   ├── useColorScheme.ts
│   ├── useSession.ts                # Auth session from Supabase
│   ├── useItems.ts                  # Realtime-aware item list
│   ├── useCollections.ts
│   └── useRegretScore.ts
│
├── constants/
│   └── colors.ts
│
├── assets/
│   ├── fonts/
│   └── illustrations/
│
├── global.css
├── tailwind.config.js
├── babel.config.js
├── metro.config.js
└── app.json
```

---

## Phase 1 — Design Tokens & Base Components [x]

### 1.1 Color constants [x]

```ts
// constants/colors.ts
export const colors = {
  blush:     "#F2C4CE",
  navy:      "#062045",
  blushSoft: "#fde8ee",
  navySoft:  "#e8edf5",
  cream:     "#fdf8f5",
  white:     "#ffffff",

  danger:  "#e2574a",
  warning: "#f0a500",
  success: "#3b9c6e",

  riskHigh: { bg: "#FCEBEB", text: "#A32D2D" },
  riskMid:  { bg: "#FAEEDA", text: "#854F0B" },
  riskLow:  { bg: "#EAF3DE", text: "#3B6D11" },
} as const;
```

### 1.2 Button [x]

```tsx
// components/ui/button.tsx
import { Button as BaseButton } from "~/components/primitives/button";
import { cn } from "~/lib/utils";

interface Props extends React.ComponentProps<typeof BaseButton> {
  variant?: "primary" | "secondary" | "ghost" | "danger";
}

const variantStyles = {
  primary:   "bg-navy-500 active:bg-navy-400",
  secondary: "bg-blush-300 active:bg-blush-400",
  ghost:     "bg-transparent border border-blush-300",
  danger:    "bg-red-100 border border-red-300",
};

export function Button({ variant = "primary", className, ...props }: Props) {
  return (
    <BaseButton
      className={cn(
        "rounded-3xl h-12 px-6 items-center justify-center",
        variantStyles[variant],
        className
      )}
      {...props}
    />
  );
}
```

### 1.3 Card [x]

```tsx
// components/ui/card.tsx
import { Card as BaseCard } from "~/components/primitives/card";
import { cn } from "~/lib/utils";

export function Card({ className, ...props }: React.ComponentProps<typeof BaseCard>) {
  return (
    <BaseCard
      className={cn(
        "bg-white rounded-3xl p-4 border border-blush-200 shadow-sm",
        className
      )}
      {...props}
    />
  );
}
```

### 1.4 Risk badge [x]

```tsx
// components/ui/badge.tsx
import { Badge as BaseBadge } from "~/components/primitives/badge";
import { Text } from "~/components/ui/text";
import { cn } from "~/lib/utils";

type Risk = "high" | "mid" | "low";

const riskMap: Record<Risk, { container: string; label: string }> = {
  high: { container: "bg-red-50 border border-red-200",     label: "text-red-800" },
  mid:  { container: "bg-amber-50 border border-amber-200", label: "text-amber-800" },
  low:  { container: "bg-green-50 border border-green-200", label: "text-green-800" },
};

export function RiskBadge({ risk, score }: { risk: Risk; score: number }) {
  const { container, label } = riskMap[risk];
  return (
    <BaseBadge className={cn("rounded-full px-3 py-1", container)}>
      <Text className={cn("text-xs font-semibold", label)}>{score}% regret</Text>
    </BaseBadge>
  );
}
```

---

## Phase 2 — Core Data Layer [x]

### 2.1 TypeScript types [x]

```ts
// lib/types.ts
export type DelayType = "3d" | "7d" | "2w" | "payday" | "custom";
export type ItemStatus = "waiting" | "bought" | "forgot" | "snoozed";
export type NotifFrequency = "on_schedule" | "daily_digest" | "weekly_digest" | "never";

export interface Collection {
  id:              string;
  user_id:         string;
  name:            string;
  emoji:           string;
  color?:          string;
  sort_order:      number;
  notif_enabled:   boolean;
  notif_frequency: NotifFrequency;
  notif_time?:     string;   // "HH:MM"
  notif_weekday?:  number;   // 0–6
  created_at:      string;
}

export interface WishlistItem {
  id:             string;
  user_id:        string;
  collection_id?: string;

  // Core
  title:          string;
  notes?:         string;
  price?:         number;
  currency:       string;

  // Source links
  source_url?:    string;
  tiktok_url?:    string;
  instagram_url?: string;

  // Image
  image_path?:    string;   // Supabase Storage path
  image_url?:     string;   // signed URL (client-side only, not stored)

  // Timing
  added_at:       string;
  added_hour:     number;
  delay_type:     DelayType;
  remind_at:      string;
  status:         ItemStatus;

  // Score
  regret_score:   number;
  score_factors?: ScoreFactors;

  notif_id?:      string;
  updated_at:     string;
}

export interface ScoreFactors {
  timeOfDay:      number;
  priceVsAvg:     number;
  categoryRisk:   number;
  historyIgnored: number;
}

export interface NotificationPrefs {
  user_id:           string;
  global_enabled:    boolean;
  quiet_hours_start: string;
  quiet_hours_end:   string;
  notify_on_remind:  boolean;
  notify_digest:     boolean;
  digest_frequency:  "daily" | "weekly";
  digest_time:       string;
  digest_weekday:    number;
}
```

### 2.2 Zustand store (optimistic local cache) [x]

```ts
// lib/store.ts
// The store mirrors Supabase data locally so the UI is instant.
// Mutations write to Supabase first, then refresh the store.
import { create } from "zustand";
import { WishlistItem, Collection, NotificationPrefs } from "./types";

interface AppStore {
  // Items
  items:          WishlistItem[];
  setItems:       (items: WishlistItem[]) => void;
  upsertItem:     (item: WishlistItem) => void;
  removeItem:     (id: string) => void;

  // Collections
  collections:    Collection[];
  setCollections: (cols: Collection[]) => void;
  upsertCollection: (col: Collection) => void;
  removeCollection: (id: string) => void;

  // Active filter
  activeCollectionId: string | null;
  setActiveCollection: (id: string | null) => void;

  // Notification prefs
  notifPrefs:    NotificationPrefs | null;
  setNotifPrefs: (prefs: NotificationPrefs) => void;
}

export const useAppStore = create<AppStore>((set) => ({
  items:       [],
  setItems:    (items)       => set({ items }),
  upsertItem:  (item)        => set((s) => ({
    items: s.items.find((i) => i.id === item.id)
      ? s.items.map((i) => i.id === item.id ? item : i)
      : [item, ...s.items],
  })),
  removeItem:  (id)          => set((s) => ({ items: s.items.filter((i) => i.id !== id) })),

  collections: [],
  setCollections: (cols)     => set({ collections: cols }),
  upsertCollection: (col)    => set((s) => ({
    collections: s.collections.find((c) => c.id === col.id)
      ? s.collections.map((c) => c.id === col.id ? col : c)
      : [...s.collections, col],
  })),
  removeCollection: (id)     => set((s) => ({
    collections: s.collections.filter((c) => c.id !== id),
  })),

  activeCollectionId: null,
  setActiveCollection: (id)  => set({ activeCollectionId: id }),

  notifPrefs:    null,
  setNotifPrefs: (prefs)     => set({ notifPrefs: prefs }),
}));
```

### 2.3 Supabase item helpers [x]

```ts
// lib/items.ts
import { supabase } from "./supabase";
import { WishlistItem } from "./types";

export async function fetchItems(userId: string): Promise<WishlistItem[]> {
  const { data, error } = await supabase
    .from("items")
    .select("*")
    .eq("user_id", userId)
    .order("added_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function insertItem(item: Omit<WishlistItem, "id" | "updated_at">): Promise<WishlistItem> {
  const { data, error } = await supabase
    .from("items")
    .insert(item)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateItem(id: string, patch: Partial<WishlistItem>): Promise<WishlistItem> {
  const { data, error } = await supabase
    .from("items")
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteItem(id: string) {
  const { error } = await supabase.from("items").delete().eq("id", id);
  if (error) throw error;
}
```

### 2.4 Image upload helper [x]

```ts
// lib/images.ts
import { supabase } from "./supabase";
import * as ImageManipulator from "expo-image-manipulator";

export async function uploadItemImage(
  userId: string,
  itemId: string,
  localUri: string
): Promise<string> {
  // Resize to max 1200px wide and convert to JPEG
  const compressed = await ImageManipulator.manipulateAsync(
    localUri,
    [{ resize: { width: 1200 } }],
    { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
  );

  const path = `${userId}/items/${itemId}.jpg`;

  // Fetch the file as blob
  const response = await fetch(compressed.uri);
  const blob = await response.blob();

  const { error } = await supabase.storage
    .from("item-images")
    .upload(path, blob, { contentType: "image/jpeg", upsert: true });

  if (error) throw error;
  return path;
}

export async function getImageUrl(path: string): Promise<string> {
  const { data } = await supabase.storage
    .from("item-images")
    .createSignedUrl(path, 3600); // 1 hour TTL
  return data?.signedUrl ?? "";
}

export async function deleteImage(path: string) {
  await supabase.storage.from("item-images").remove([path]);
}
```

### 2.5 Collection helpers [x]

```ts
// lib/collections.ts
import { supabase } from "./supabase";
import { Collection } from "./types";

export async function fetchCollections(userId: string): Promise<Collection[]> {
  const { data, error } = await supabase
    .from("collections")
    .select("*")
    .eq("user_id", userId)
    .order("sort_order");
  if (error) throw error;
  return data ?? [];
}

export async function insertCollection(col: Omit<Collection, "id" | "created_at">): Promise<Collection> {
  const { data, error } = await supabase
    .from("collections")
    .insert(col)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateCollection(id: string, patch: Partial<Collection>): Promise<Collection> {
  const { data, error } = await supabase
    .from("collections")
    .update(patch)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteCollection(id: string) {
  const { error } = await supabase.from("collections").delete().eq("id", id);
  if (error) throw error;
}

export async function reorderCollections(orderedIds: string[]) {
  const updates = orderedIds.map((id, index) =>
    supabase.from("collections").update({ sort_order: index }).eq("id", id)
  );
  await Promise.all(updates);
}
```

### 2.6 Regret scoring algorithm [x]

```ts
// lib/regret-score.ts
import { WishlistItem, ScoreFactors } from "./types";

const HIGH_RISK_KEYWORDS = ["clothing", "beauty", "accessories", "shoes", "fashion"];
const MED_RISK_KEYWORDS  = ["home-decor", "tech", "fitness"];

export function computeRegretScore(
  item: Pick<WishlistItem, "added_hour" | "price" | "collection_id">,
  avgSpendForCollection: number,
  recentIgnoredInCollection: number,
  collectionName?: string
): { score: number; factors: ScoreFactors } {
  const hour = item.added_hour;
  const isLateNight = hour >= 22 || hour <= 3;
  const isEvening   = hour >= 19 && hour < 22;
  const timeOfDay   = isLateNight ? 30 : isEvening ? 18 : hour < 9 ? 10 : 0;

  const ratio      = avgSpendForCollection > 0 && item.price
    ? item.price / avgSpendForCollection : 1;
  const priceVsAvg = Math.min(30, Math.round(ratio * 15));

  const colLower    = collectionName?.toLowerCase() ?? "";
  const categoryRisk =
    HIGH_RISK_KEYWORDS.some((k) => colLower.includes(k)) ? 20 :
    MED_RISK_KEYWORDS.some((k) => colLower.includes(k))  ? 12 : 5;

  const historyIgnored = Math.min(20, recentIgnoredInCollection * 4);

  const score = Math.min(100, timeOfDay + priceVsAvg + categoryRisk + historyIgnored);
  return { score, factors: { timeOfDay, priceVsAvg, categoryRisk, historyIgnored } };
}

export function riskLevel(score: number): "low" | "mid" | "high" {
  if (score >= 60) return "high";
  if (score >= 35) return "mid";
  return "low";
}

export function factorLabels(f: ScoreFactors, addedHour: number): string[] {
  const labels: string[] = [];
  if (f.timeOfDay >= 18) labels.push(`Added at ${formatHour(addedHour)} 🌙`);
  if (f.priceVsAvg >= 20) labels.push("Way above your usual spend here");
  else if (f.priceVsAvg >= 12) labels.push("A bit above your avg for this collection");
  if (f.categoryRisk >= 20) labels.push("High-impulse category for you");
  if (f.historyIgnored >= 8) labels.push("You ignored similar items recently");
  return labels;
}

function formatHour(h: number) {
  const period = h >= 12 ? "pm" : "am";
  return `${h % 12 || 12}${period}`;
}
```

### 2.7 Notifications [x]

```ts
// lib/notifications.ts
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { WishlistItem, NotificationPrefs, Collection } from "./types";
import { supabase } from "./supabase";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge:  false,
  }),
});

export async function requestPermissions() {
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("pausy", {
      name:       "Pausy reminders",
      importance: Notifications.AndroidImportance.HIGH,
    });
  }
  const { status } = await Notifications.requestPermissionsAsync();
  return status === "granted";
}

export async function registerNotificationCategories() {
  await Notifications.setNotificationCategoryAsync("ITEM_REMINDER", [
    { identifier: "FORGOT",     buttonTitle: "I forgot it 👋",   options: { isDestructive: false } },
    { identifier: "STILL_WANT", buttonTitle: "Still want it 💕", options: { isDestructive: false } },
    { identifier: "SNOOZE",     buttonTitle: "One more week ⏰",  options: { isDestructive: false } },
  ]);
}

// Check quiet hours & collection notif settings before scheduling
export async function scheduleReminder(
  item: WishlistItem,
  globalPrefs: NotificationPrefs | null,
  collection?: Collection
): Promise<string | null> {
  // Respect global kill switch
  if (globalPrefs && !globalPrefs.global_enabled) return null;
  // Respect collection kill switch
  if (collection && !collection.notif_enabled) return null;
  // If collection uses digest, don't schedule per-item push
  if (collection && collection.notif_frequency !== "on_schedule") return null;

  const trigger = new Date(item.remind_at);
  const notifId = await Notifications.scheduleNotificationAsync({
    content: {
      title: "⏰ Still want it?",
      body:  `${item.title}${item.price ? ` — ${item.currency}${item.price}` : ""}. Do you still care?`,
      data:  { itemId: item.id },
      categoryIdentifier: "ITEM_REMINDER",
    },
    trigger,
  });
  return notifId;
}

export async function cancelReminder(notifId: string) {
  await Notifications.cancelScheduledNotificationAsync(notifId);
}

// Schedule a daily or weekly digest notification for a collection
export async function scheduleDigest(collection: Collection) {
  if (!collection.notif_enabled) return;
  if (collection.notif_frequency === "on_schedule" || collection.notif_frequency === "never") return;

  const trigger: Notifications.NotificationTriggerInput =
    collection.notif_frequency === "daily_digest"
      ? {
          hour:   parseInt(collection.notif_time?.split(":")[0] ?? "9"),
          minute: parseInt(collection.notif_time?.split(":")[1] ?? "0"),
          repeats: true,
        }
      : {
          weekday: (collection.notif_weekday ?? 1) + 1, // Expo uses 1=Sun
          hour:    parseInt(collection.notif_time?.split(":")[0] ?? "9"),
          minute:  parseInt(collection.notif_time?.split(":")[1] ?? "0"),
          repeats: true,
        };

  await Notifications.scheduleNotificationAsync({
    content: {
      title: `${collection.emoji} ${collection.name} check-in`,
      body:  "Time to review your waiting list 👀",
      data:  { collectionId: collection.id, type: "digest" },
    },
    trigger,
  });
}
```

---

## Phase 3 — Auth & Screens [x]

### 3.1 Root layout [x]

```tsx
// app/_layout.tsx
import "../global.css";
import { useEffect } from "react";
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
import * as SplashScreen from "expo-splash-screen";
import { supabase } from "~/lib/supabase";
import { requestPermissions, registerNotificationCategories } from "~/lib/notifications";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded] = useFonts({
    Outfit_400Regular,
    Outfit_500Medium,
    Outfit_600SemiBold,
    Outfit_700Bold,
    Outfit_800ExtraBold,
  });

  useEffect(() => {
    if (loaded) SplashScreen.hideAsync();
  }, [loaded]);

  useEffect(() => {
    requestPermissions();
    registerNotificationCategories();
  }, []);

  if (!loaded) return null;

  return (
    <>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false }} />
    </>
  );
}
```

### 3.2 Auth Screens (Email + Google) [x]

```tsx
// app/(auth)/sign-in.tsx
import { View, TextInput, Pressable, Alert } from "react-native";
import { Link, router } from "expo-router";
import { useState } from "react";
import * as WebBrowser from "expo-web-browser";
import * as AuthSession from "expo-auth-session";
import { supabase } from "~/lib/supabase";
import { Button } from "~/components/ui/button";
import { Text } from "~/components/ui/text";
import { Card } from "~/components/ui/card";
import { colors } from "~/constants/colors";

WebBrowser.maybeCompleteAuthSession();

export default function SignIn() {
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading]   = useState(false);

  async function handleSignIn() {
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) Alert.alert("Error", error.message);
    else router.replace("/(tabs)/waiting");
    setLoading(false);
  }

  async function handleGoogleSignIn() {
    // 1. Get redirect URL
    const redirectUrl = AuthSession.makeRedirectUri();
    
    // 2. Start Supabase OAuth
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectUrl,
        skipBrowserRedirect: true,
      },
    });

    if (error) return Alert.alert("Error", error.message);

    // 3. Open browser for auth
    const res = await WebBrowser.openAuthSessionAsync(data.url, redirectUrl);

    if (res.type === 'success') {
      const { url } = res;
      const params = new URLSearchParams(url.split('#')[1]);
      const access_token = params.get('access_token');
      const refresh_token = params.get('refresh_token');

      if (access_token && refresh_token) {
        await supabase.auth.setSession({ access_token, refresh_token });
        router.replace("/(tabs)/waiting");
      }
    }
  }

  return (
    <View className="flex-1 bg-cream justify-center px-6">
      <Text className="text-3xl font-display text-navy-500 mb-8 text-center">Welcome Back 🎀</Text>
      
      <Card className="gap-4">
        <TextInput
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          className="border-b border-blush-200 py-3 text-navy-500"
        />
        <TextInput
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          className="border-b border-blush-200 py-3 text-navy-500"
        />
        <Button variant="primary" onPress={handleSignIn} disabled={loading}>
          <Text className="text-white font-bold">{loading ? "Wait..." : "Sign In"}</Text>
        </Button>
      </Card>

      <View className="flex-row items-center my-8">
        <View className="flex-1 h-[1px] bg-blush-200" />
        <Text className="mx-4 text-navy-300 text-xs font-semibold uppercase">Or continue with</Text>
        <View className="flex-1 h-[1px] bg-blush-200" />
      </View>

      <Button variant="ghost" onPress={handleGoogleSignIn} className="mb-8">
        <Text className="text-navy-500 font-semibold">Google Auth 🚀</Text>
      </Button>

      <Link href="/(auth)/sign-up" asChild>
        <Pressable>
          <Text className="text-center text-navy-300">Don't have an account? <Text className="text-blush-500 font-bold">Sign Up</Text></Text>
        </Pressable>
      </Link>
    </View>
  );
}
```

### 3.3 Tab navigator [x]
```tsx
// app/(tabs)/_layout.tsx
import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "~/constants/colors";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown:            false,
        tabBarActiveTintColor:  colors.navy,
        tabBarInactiveTintColor:"#a0a0a0",
        tabBarStyle: {
          backgroundColor: colors.white,
          borderTopColor:  colors.blush,
          borderTopWidth:  1,
          paddingBottom:   8,
          height:          64,
        },
        tabBarLabelStyle: {
          fontFamily: "Outfit_600SemiBold",
          fontSize:   11,
        },
      }}
    >
      <Tabs.Screen name="waiting" options={{ title: "Waiting",
        tabBarIcon: ({ color, size }) => <Ionicons name="pause-circle-outline" color={color} size={size} /> }} />
      <Tabs.Screen name="stats"   options={{ title: "Saved",
        tabBarIcon: ({ color, size }) => <Ionicons name="sparkles-outline"     color={color} size={size} /> }} />
      <Tabs.Screen name="settings" options={{ title: "Settings",
        tabBarIcon: ({ color, size }) => <Ionicons name="settings-outline"     color={color} size={size} /> }} />
    </Tabs>
  );
}
```

### 3.3 Waiting screen (with collection filter) [x]

```tsx
// app/(tabs)/waiting.tsx
import { View, FlatList, Pressable, ScrollView } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAppStore } from "~/lib/store";
import { Text } from "~/components/ui/text";
import { WishlistItemRow } from "~/components/WishlistItem";
import { CollectionPicker } from "~/components/CollectionPicker";
import { SavingsBanner } from "~/components/SavingsBanner";
import { EmptyState } from "~/components/EmptyState";
import { colors } from "~/constants/colors";

export default function WaitingScreen() {
  const allItems          = useAppStore((s) => s.items);
  const activeCollectionId = useAppStore((s) => s.activeCollectionId);
  const setActiveCollection = useAppStore((s) => s.setActiveCollection);
  const collections       = useAppStore((s) => s.collections);

  const items = allItems.filter((i) =>
    i.status === "waiting" &&
    (activeCollectionId === null || i.collection_id === activeCollectionId)
  );

  const forgot = allItems.filter((i) => i.status === "forgot");
  const saved  = forgot.reduce((sum, i) => sum + (i.price ?? 0), 0);

  return (
    <View className="flex-1 bg-cream">
      <View className="px-6 pt-16 pb-2 flex-row items-center justify-between">
        <View>
          <Text className="text-2xl font-display text-navy-500">Pausy 🎀</Text>
          <Text className="text-sm text-navy-300 mt-0.5">
            {items.length} {items.length === 1 ? "thing" : "things"} cooling off
          </Text>
        </View>
        <Pressable
          onPress={() => router.push("/add-item")}
          className="w-10 h-10 rounded-full bg-blush-300 items-center justify-center active:opacity-70"
        >
          <Ionicons name="add" size={22} color={colors.navy} />
        </Pressable>
      </View>

      {/* Collection filter strip */}
      <CollectionPicker
        collections={collections}
        selected={activeCollectionId}
        onSelect={setActiveCollection}
      />

      <FlatList
        data={items}
        keyExtractor={(i) => i.id}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 32 }}
        ListHeaderComponent={
          saved > 0 ? <SavingsBanner amount={saved} count={forgot.length} /> : null
        }
        ListEmptyComponent={<EmptyState />}
        renderItem={({ item }) => (
          <WishlistItemRow
            item={item}
            onPress={() => router.push(`/item/${item.id}`)}
          />
        )}
        ItemSeparatorComponent={() => <View className="h-3" />}
      />
    </View>
  );
}
```

### 3.4 Add Item screen (rich fields) [x]

```tsx
// app/add-item.tsx
import { View, TextInput, ScrollView, Pressable, Image, Alert } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import * as ImagePicker from "expo-image-picker";
import * as Haptics from "expo-haptics";
import { addDays, addWeeks } from "date-fns";
import { nanoid } from "nanoid/non-secure";
import { useAppStore } from "~/lib/store";
import { insertItem } from "~/lib/items";
import { uploadItemImage } from "~/lib/images";
import { computeRegretScore } from "~/lib/regret-score";
import { scheduleReminder } from "~/lib/notifications";
import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";
import { Text } from "~/components/ui/text";
import { DelayPicker } from "~/components/DelayPicker";
import { CollectionPicker } from "~/components/CollectionPicker";
import { SourceLinkInput } from "~/components/SourceLinkInput";
import { RegretScoreCard } from "~/components/RegretScore";
import { colors } from "~/constants/colors";
import { DelayType } from "~/lib/types";

export default function AddItemScreen() {
  const params     = useLocalSearchParams<{ url?: string; title?: string }>();
  const collections = useAppStore((s) => s.collections);
  const allItems   = useAppStore((s) => s.items);
  const upsertItem = useAppStore((s) => s.upsertItem);
  const notifPrefs = useAppStore((s) => s.notifPrefs);

  const [title,        setTitle]        = useState(params.title ?? "");
  const [notes,        setNotes]        = useState("");
  const [price,        setPrice]        = useState("");
  const [sourceUrl,    setSourceUrl]    = useState(params.url ?? "");
  const [tiktokUrl,    setTiktokUrl]    = useState("");
  const [instagramUrl, setInstagramUrl] = useState("");
  const [imageUri,     setImageUri]     = useState<string | null>(null);
  const [collectionId, setCollectionId] = useState<string | null>(
    collections[0]?.id ?? null
  );
  const [delay,        setDelay]        = useState<DelayType>("7d");
  const [saving,       setSaving]       = useState(false);

  const hour       = new Date().getHours();
  const collection = collections.find((c) => c.id === collectionId);

  const avgForCollection = (() => {
    const relevant = allItems.filter((i) => i.collection_id === collectionId && i.price);
    if (!relevant.length) return 0;
    return relevant.reduce((s, i) => s + (i.price ?? 0), 0) / relevant.length;
  })();

  const recentIgnored = allItems
    .filter((i) => i.collection_id === collectionId && i.status === "forgot")
    .slice(0, 5).length;

  const { score, factors } = computeRegretScore(
    { added_hour: hour, price: parseFloat(price) || 0, collection_id: collectionId ?? undefined },
    avgForCollection,
    recentIgnored,
    collection?.name
  );

  const remindAt = (() => {
    const now = new Date();
    if (delay === "3d") return addDays(now, 3).toISOString();
    if (delay === "7d") return addDays(now, 7).toISOString();
    if (delay === "2w") return addWeeks(now, 2).toISOString();
    return addDays(now, 14).toISOString();
  })();

  async function pickImage() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality:    0.9,
    });
    if (!result.canceled) setImageUri(result.assets[0].uri);
  }

  async function handleSave() {
    if (!title.trim()) return;
    setSaving(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const itemId = nanoid();
      let image_path: string | undefined;

      if (imageUri) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) image_path = await uploadItemImage(user.id, itemId, imageUri);
      }

      const newItem = await insertItem({
        id:            itemId,
        user_id:       "", // filled server-side via RLS / auth.uid()
        collection_id: collectionId ?? undefined,
        title:         title.trim(),
        notes:         notes.trim() || undefined,
        price:         parseFloat(price) || undefined,
        currency:      "€",
        source_url:    sourceUrl.trim() || undefined,
        tiktok_url:    tiktokUrl.trim() || undefined,
        instagram_url: instagramUrl.trim() || undefined,
        image_path,
        added_at:      new Date().toISOString(),
        added_hour:    hour,
        delay_type:    delay,
        remind_at:     remindAt,
        status:        "waiting",
        regret_score:  score,
        score_factors: factors,
      });

      const notifId = await scheduleReminder(newItem, notifPrefs, collection);
      if (notifId) await updateItem(newItem.id, { notif_id: notifId });

      upsertItem({ ...newItem, notif_id: notifId ?? undefined });
      router.back();
    } finally {
      setSaving(false);
    }
  }

  return (
    <View className="flex-1 bg-cream">
      <View className="px-6 pt-16 pb-4 flex-row items-center gap-4">
        <Text className="text-xl font-display text-navy-500 flex-1">Add to wait list</Text>
        <Button variant="ghost" onPress={() => router.back()} className="h-9 px-4">
          <Text className="text-sm text-navy-400">Cancel</Text>
        </Button>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>

        {/* Live regret score preview */}
        {title.length > 0 && (
          <RegretScoreCard score={score} factors={factors} addedHour={hour} />
        )}

        {/* Title */}
        <Card>
          <Text className="text-xs text-navy-300 font-semibold mb-2 uppercase tracking-wide">What is it?</Text>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="Satin midi dress, perfume, headphones…"
            placeholderTextColor="#c4a0ab"
            className="text-navy-500 font-medium text-base"
          />
        </Card>

        {/* Notes */}
        <Card>
          <Text className="text-xs text-navy-300 font-semibold mb-2 uppercase tracking-wide">Notes (optional)</Text>
          <TextInput
            value={notes}
            onChangeText={setNotes}
            placeholder="Saw it at Zara, size M, the blush one…"
            placeholderTextColor="#c4a0ab"
            multiline
            className="text-navy-500 font-medium text-base"
          />
        </Card>

        {/* Price */}
        <Card>
          <Text className="text-xs text-navy-300 font-semibold mb-2 uppercase tracking-wide">Price (optional)</Text>
          <TextInput
            value={price}
            onChangeText={setPrice}
            placeholder="89"
            keyboardType="decimal-pad"
            placeholderTextColor="#c4a0ab"
            className="text-navy-500 font-medium text-base"
          />
        </Card>

        {/* Source links */}
        <SourceLinkInput
          sourceUrl={sourceUrl}     onChangeSource={setSourceUrl}
          tiktokUrl={tiktokUrl}     onChangeTiktok={setTiktokUrl}
          instagramUrl={instagramUrl} onChangeInstagram={setInstagramUrl}
        />

        {/* Screenshot */}
        <Card>
          <Text className="text-xs text-navy-300 font-semibold mb-3 uppercase tracking-wide">Screenshot (optional)</Text>
          {imageUri ? (
            <View>
              <Image source={{ uri: imageUri }} className="w-full h-48 rounded-2xl" resizeMode="cover" />
              <Pressable onPress={() => setImageUri(null)} className="mt-2">
                <Text className="text-xs text-navy-300 text-center">Remove</Text>
              </Pressable>
            </View>
          ) : (
            <Button variant="ghost" onPress={pickImage}>
              <Text className="text-navy-400">📸 Add screenshot</Text>
            </Button>
          )}
        </Card>

        {/* Collection */}
        <Card>
          <Text className="text-xs text-navy-300 font-semibold mb-3 uppercase tracking-wide">Collection</Text>
          <CollectionPicker
            collections={collections}
            selected={collectionId}
            onSelect={setCollectionId}
            showAll={false}
          />
          <Pressable onPress={() => router.push("/collections/manage")} className="mt-3">
            <Text className="text-xs text-blush-500 text-center">+ Manage collections</Text>
          </Pressable>
        </Card>

        {/* Delay */}
        <Card>
          <Text className="text-xs text-navy-300 font-semibold mb-3 uppercase tracking-wide">How long to wait?</Text>
          <DelayPicker selected={delay} onChange={setDelay} />
        </Card>

        <Button variant="primary" onPress={handleSave} className="mt-2 h-14" disabled={saving}>
          <Text className="text-white font-bold text-base">
            {saving ? "Saving…" : "Start the timer 🎀"}
          </Text>
        </Button>

      </ScrollView>
    </View>
  );
}
```

---

## Phase 4 — Feature Components [x]

### 4.1 SourceLinkInput [x]

```tsx
// components/SourceLinkInput.tsx
// Auto-detects whether a pasted URL is TikTok, Instagram, or generic.
// Shows only the relevant input(s) — the user doesn't need to think about it.

import { View, TextInput, Pressable } from "react-native";
import { useState } from "react";
import { Card } from "~/components/ui/card";
import { Text } from "~/components/ui/text";

function detectType(url: string): "tiktok" | "instagram" | "web" | null {
  if (!url) return null;
  if (url.includes("tiktok.com") || url.includes("vm.tiktok")) return "tiktok";
  if (url.includes("instagram.com") || url.includes("instagr.am")) return "instagram";
  return "web";
}

interface Props {
  sourceUrl:         string; onChangeSource:    (v: string) => void;
  tiktokUrl:         string; onChangeTiktok:    (v: string) => void;
  instagramUrl:      string; onChangeInstagram: (v: string) => void;
}

export function SourceLinkInput({
  sourceUrl, onChangeSource,
  tiktokUrl, onChangeTiktok,
  instagramUrl, onChangeInstagram,
}: Props) {
  const [expanded, setExpanded] = useState(false);

  const handlePaste = (text: string) => {
    const type = detectType(text);
    if (type === "tiktok")    { onChangeTiktok(text);    onChangeSource(""); }
    if (type === "instagram") { onChangeInstagram(text); onChangeSource(""); }
    if (type === "web")       { onChangeSource(text); }
  };

  return (
    <Card>
      <Text className="text-xs text-navy-300 font-semibold mb-3 uppercase tracking-wide">
        Source link (optional)
      </Text>

      {/* Smart paste field */}
      <TextInput
        value={tiktokUrl || instagramUrl || sourceUrl}
        onChangeText={handlePaste}
        placeholder="Paste a TikTok, Instagram, or any link…"
        placeholderTextColor="#c4a0ab"
        autoCapitalize="none"
        keyboardType="url"
        className="text-navy-500 font-medium text-base mb-2"
      />

      {/* Badge showing detected type */}
      {(tiktokUrl || instagramUrl || sourceUrl) && (
        <View className="flex-row gap-2 mt-1">
          {tiktokUrl    && <View className="bg-black rounded-full px-3 py-1"><Text className="text-white text-xs font-semibold">TikTok 🎵</Text></View>}
          {instagramUrl && <View className="bg-pink-500 rounded-full px-3 py-1"><Text className="text-white text-xs font-semibold">Instagram 📸</Text></View>}
          {sourceUrl    && <View className="bg-navy-100 rounded-full px-3 py-1"><Text className="text-navy-500 text-xs font-semibold">🌐 Link</Text></View>}
        </View>
      )}

      {/* Expanded: separate fields for power users */}
      <Pressable onPress={() => setExpanded(!expanded)} className="mt-3">
        <Text className="text-xs text-blush-500">{expanded ? "Less ↑" : "Add multiple links ↓"}</Text>
      </Pressable>

      {expanded && (
        <View className="mt-3 gap-3">
          <TextInput value={tiktokUrl}    onChangeText={onChangeTiktok}    placeholder="TikTok URL"    placeholderTextColor="#c4a0ab" autoCapitalize="none" keyboardType="url" className="text-navy-500 text-sm border-b border-blush-200 pb-2" />
          <TextInput value={instagramUrl} onChangeText={onChangeInstagram} placeholder="Instagram URL" placeholderTextColor="#c4a0ab" autoCapitalize="none" keyboardType="url" className="text-navy-500 text-sm border-b border-blush-200 pb-2" />
          <TextInput value={sourceUrl}    onChangeText={onChangeSource}    placeholder="Website / product URL" placeholderTextColor="#c4a0ab" autoCapitalize="none" keyboardType="url" className="text-navy-500 text-sm" />
        </View>
      )}
    </Card>
  );
}
```

### 4.2 CollectionPicker [x]

```tsx
// components/CollectionPicker.tsx
// Horizontal scrollable chip row used both in Waiting screen (filter)
// and Add Item screen (assign).

import { ScrollView, Pressable, View } from "react-native";
import * as Haptics from "expo-haptics";
import { Collection } from "~/lib/types";
import { Text } from "~/components/ui/text";
import { cn } from "~/lib/utils";

interface Props {
  collections: Collection[];
  selected:    string | null;
  onSelect:    (id: string | null) => void;
  showAll?:    boolean;   // show "All" chip (for filter mode)
}

export function CollectionPicker({ collections, selected, onSelect, showAll = true }: Props) {
  const chips = showAll
    ? [{ id: null, name: "All", emoji: "✨" }, ...collections]
    : collections;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ paddingHorizontal: 16, gap: 8, paddingVertical: 8 }}
    >
      {chips.map((col) => {
        const active = selected === col.id;
        return (
          <Pressable
            key={col.id ?? "__all__"}
            onPress={() => { Haptics.selectionAsync(); onSelect(col.id ?? null); }}
            className={cn(
              "flex-row items-center gap-1.5 px-4 py-2 rounded-full border",
              active ? "bg-navy-500 border-navy-500" : "bg-white border-blush-300"
            )}
          >
            <Text className="text-base">{col.emoji}</Text>
            <Text className={cn("text-sm font-semibold", active ? "text-white" : "text-navy-400")}>
              {col.name}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}
```

### 4.3 WishlistItem row (with image + source badges) [x]

```tsx
// components/WishlistItem.tsx
import { Pressable, View, Image } from "react-native";
import * as Haptics from "expo-haptics";
import { Ionicons } from "@expo/vector-icons";
import { formatDistanceToNow } from "date-fns";
import { WishlistItem } from "~/lib/types";
import { riskLevel } from "~/lib/regret-score";
import { Card } from "~/components/ui/card";
import { Text } from "~/components/ui/text";
import { RiskBadge } from "~/components/ui/badge";

export function WishlistItemRow({
  item, onPress,
}: { item: WishlistItem; onPress: () => void }) {
  const risk     = riskLevel(item.regret_score);
  const timeLeft = formatDistanceToNow(new Date(item.remind_at), { addSuffix: true });

  return (
    <Pressable onPress={() => { Haptics.selectionAsync(); onPress(); }} className="active:opacity-80">
      <Card className="flex-row items-center gap-3">

        {/* Thumbnail: screenshot if exists, else placeholder */}
        <View className="w-14 h-14 rounded-2xl bg-blush-100 overflow-hidden flex-shrink-0">
          {item.image_url ? (
            <Image source={{ uri: item.image_url }} className="w-full h-full" resizeMode="cover" />
          ) : (
            <View className="flex-1 items-center justify-center">
              <Text className="text-2xl">🛍️</Text>
            </View>
          )}
        </View>

        {/* Main content */}
        <View className="flex-1 min-w-0">
          <Text className="font-semibold text-navy-500 text-sm" numberOfLines={1}>{item.title}</Text>
          <Text className="text-xs text-navy-300 mt-0.5">
            {item.price ? `${item.currency}${item.price} · ` : ""}reminder {timeLeft}
          </Text>

          {/* Source badges */}
          <View className="flex-row gap-1.5 mt-1.5">
            {item.tiktok_url    && <View className="bg-black rounded-full px-2 py-0.5"><Text className="text-white text-[10px] font-semibold">TikTok</Text></View>}
            {item.instagram_url && <View className="bg-pink-500 rounded-full px-2 py-0.5"><Text className="text-white text-[10px] font-semibold">Instagram</Text></View>}
            {item.source_url    && !item.tiktok_url && !item.instagram_url && (
              <View className="bg-navy-100 rounded-full px-2 py-0.5"><Text className="text-navy-500 text-[10px] font-semibold">Link</Text></View>
            )}
          </View>
        </View>

        <RiskBadge risk={risk} score={item.regret_score} />
      </Card>
    </Pressable>
  );
}
```

### 4.4 DelayPicker (with custom date) [x]

```tsx
// components/DelayPicker.tsx
import { View, Pressable } from "react-native";
import * as Haptics from "expo-haptics";
import { DelayType } from "~/lib/types";
import { Text } from "~/components/ui/text";
import { cn } from "~/lib/utils";

const OPTIONS: { label: string; value: DelayType }[] = [
  { label: "3 days",   value: "3d"     },
  { label: "7 days",   value: "7d"     },
  { label: "2 weeks",  value: "2w"     },
  { label: "Payday 💸", value: "payday" },
  { label: "Custom 📅", value: "custom" },
];

export function DelayPicker({
  selected, onChange,
}: { selected: DelayType; onChange: (v: DelayType) => void }) {
  return (
    <View className="flex-row flex-wrap gap-2">
      {OPTIONS.map((opt) => {
        const active = selected === opt.value;
        return (
          <Pressable
            key={opt.value}
            onPress={() => { Haptics.selectionAsync(); onChange(opt.value); }}
            className={cn(
              "px-4 py-2 rounded-full border",
              active ? "bg-navy-500 border-navy-500" : "bg-white border-blush-300"
            )}
          >
            <Text className={cn("text-sm font-semibold", active ? "text-white" : "text-navy-400")}>
              {opt.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
```

### 4.5 RegretScore card [x]

```tsx
// components/RegretScore.tsx
import { View } from "react-native";
import { Card } from "~/components/ui/card";
import { Text } from "~/components/ui/text";
import { riskLevel, factorLabels } from "~/lib/regret-score";
import { ScoreFactors } from "~/lib/types";

export function RegretScoreCard({
  score, factors, addedHour,
}: { score: number; factors: ScoreFactors; addedHour: number }) {
  const risk    = riskLevel(score);
  const labels  = factorLabels(factors, addedHour);
  const barColor = risk === "high" ? "#e2574a" : risk === "mid" ? "#f0a500" : "#3b9c6e";
  const headline =
    risk === "high" ? "High risk 🚨" :
    risk === "mid"  ? "Proceed with caution ⚠️" :
    "Looks reasonable 🌿";

  return (
    <Card className="bg-navy-50 border-navy-100">
      <Text className="text-xs font-semibold text-navy-300 uppercase tracking-wide mb-2">
        Regret probability
      </Text>
      <View className="flex-row items-baseline gap-3">
        <Text className="text-4xl font-display text-navy-500">{score}%</Text>
        <Text className="text-sm text-navy-400 flex-1">{headline}</Text>
      </View>
      <View className="h-1.5 bg-blush-200 rounded-full mt-3 mb-3">
        <View style={{ width: `${score}%`, backgroundColor: barColor }} className="h-1.5 rounded-full" />
      </View>
      {labels.map((label, i) => (
        <View key={i} className="flex-row items-center gap-2 mb-1">
          <View className="w-1.5 h-1.5 rounded-full bg-blush-400" />
          <Text className="text-xs text-navy-400">{label}</Text>
        </View>
      ))}
    </Card>
  );
}
```

---

## Phase 5 — Collections Management [x]

### 5.1 Collections manage screen [x]

```tsx
// app/collections/manage.tsx
// List of collections with drag-to-reorder, edit, delete.
// Each collection can be tapped to open its notification settings.

import { View, FlatList, Pressable, TextInput, Alert } from "react-native";
import { router } from "expo-router";
import { useState } from "react";
import { useAppStore } from "~/lib/store";
import { insertCollection, deleteCollection } from "~/lib/collections";
import { Text } from "~/components/ui/text";
import { Card } from "~/components/ui/card";
import { Button } from "~/components/ui/button";

const EMOJIS = ["🛍️","👗","👟","💄","💍","📱","🕯️","🏋️","📚","🎮","✈️","🍽️","🌿","💅","🎨","🏠"];

export default function ManageCollectionsScreen() {
  const collections    = useAppStore((s) => s.collections);
  const upsertCollection = useAppStore((s) => s.upsertCollection);
  const removeCollection = useAppStore((s) => s.removeCollection);

  const [newName,  setNewName]  = useState("");
  const [newEmoji, setNewEmoji] = useState("🛍️");
  const [creating, setCreating] = useState(false);

  async function handleCreate() {
    if (!newName.trim()) return;
    setCreating(true);
    try {
      const col = await insertCollection({
        user_id:        "",  // filled via RLS
        name:           newName.trim(),
        emoji:          newEmoji,
        sort_order:     collections.length,
        notif_enabled:  true,
        notif_frequency:"on_schedule",
      });
      upsertCollection(col);
      setNewName("");
    } finally {
      setCreating(false);
    }
  }

  async function handleDelete(id: string) {
    Alert.alert("Delete collection?", "Items won't be deleted, just uncategorised.", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: async () => {
        await deleteCollection(id);
        removeCollection(id);
      }},
    ]);
  }

  return (
    <View className="flex-1 bg-cream">
      <View className="px-6 pt-16 pb-4 flex-row items-center gap-4">
        <Text className="text-xl font-display text-navy-500 flex-1">My Collections</Text>
        <Pressable onPress={() => router.back()}>
          <Text className="text-navy-400 text-sm">Done</Text>
        </Pressable>
      </View>

      <FlatList
        data={collections}
        keyExtractor={(c) => c.id}
        contentContainerStyle={{ paddingHorizontal: 16, gap: 10 }}
        ListFooterComponent={
          <Card className="mt-2">
            <Text className="text-xs text-navy-300 font-semibold mb-3 uppercase tracking-wide">New collection</Text>
            {/* Emoji picker */}
            <View className="flex-row flex-wrap gap-2 mb-3">
              {EMOJIS.map((e) => (
                <Pressable key={e} onPress={() => setNewEmoji(e)}
                  className={`w-9 h-9 rounded-full items-center justify-center ${newEmoji === e ? "bg-blush-300" : "bg-blush-100"}`}>
                  <Text className="text-lg">{e}</Text>
                </Pressable>
              ))}
            </View>
            <TextInput
              value={newName} onChangeText={setNewName}
              placeholder="Collection name…" placeholderTextColor="#c4a0ab"
              className="text-navy-500 font-medium text-base border-b border-blush-200 pb-2 mb-3"
            />
            <Button variant="secondary" onPress={handleCreate} disabled={creating}>
              <Text className="text-navy-500 font-semibold">{newEmoji} Create</Text>
            </Button>
          </Card>
        }
        renderItem={({ item }) => (
          <Card className="flex-row items-center gap-3">
            <Text className="text-2xl">{item.emoji}</Text>
            <Text className="font-semibold text-navy-500 flex-1">{item.name}</Text>
            <Pressable onPress={() => router.push(`/collection/${item.id}`)}>
              <Text className="text-xs text-blush-500">Settings</Text>
            </Pressable>
            <Pressable onPress={() => handleDelete(item.id)} className="ml-2">
              <Text className="text-xs text-red-400">Delete</Text>
            </Pressable>
          </Card>
        )}
      />
    </View>
  );
}
```

### 5.2 Collection notification settings screen [x]

```tsx
// app/collection/[id].tsx
// Per-collection notification frequency, time, and on/off toggle.

import { View, Switch } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { useState } from "react";
import { useAppStore } from "~/lib/store";
import { updateCollection } from "~/lib/collections";
import { scheduleDigest } from "~/lib/notifications";
import { NotifFrequency } from "~/lib/types";
import { Text } from "~/components/ui/text";
import { Card } from "~/components/ui/card";
import { Button } from "~/components/ui/button";

const FREQ_OPTIONS: { label: string; value: NotifFrequency; desc: string }[] = [
  { label: "When it expires",   value: "on_schedule",    desc: "One push when the wait timer runs out" },
  { label: "Daily digest",      value: "daily_digest",   desc: "A daily summary at a time you choose" },
  { label: "Weekly digest",     value: "weekly_digest",  desc: "Once a week recap" },
  { label: "Never",             value: "never",          desc: "No notifications for this collection" },
];

export default function CollectionSettingsScreen() {
  const { id }          = useLocalSearchParams<{ id: string }>();
  const collections     = useAppStore((s) => s.collections);
  const upsertCollection = useAppStore((s) => s.upsertCollection);
  const col             = collections.find((c) => c.id === id);
  if (!col) return null;

  const [enabled,   setEnabled]   = useState(col.notif_enabled);
  const [frequency, setFrequency] = useState<NotifFrequency>(col.notif_frequency);
  const [saving,    setSaving]    = useState(false);

  async function handleSave() {
    setSaving(true);
    const updated = await updateCollection(id, {
      notif_enabled:   enabled,
      notif_frequency: frequency,
    });
    upsertCollection(updated);
    if (enabled && frequency !== "on_schedule" && frequency !== "never") {
      await scheduleDigest(updated);
    }
    router.back();
    setSaving(false);
  }

  return (
    <View className="flex-1 bg-cream px-6 pt-16">
      <Text className="text-xl font-display text-navy-500 mb-1">{col.emoji} {col.name}</Text>
      <Text className="text-sm text-navy-300 mb-6">Notification settings</Text>

      {/* Master toggle */}
      <Card className="flex-row items-center justify-between mb-4">
        <View>
          <Text className="font-semibold text-navy-500">Notifications</Text>
          <Text className="text-xs text-navy-300 mt-0.5">Get reminders for this collection</Text>
        </View>
        <Switch
          value={enabled}
          onValueChange={setEnabled}
          trackColor={{ true: "#F2C4CE", false: "#e0e0e0" }}
          thumbColor={enabled ? "#062045" : "#fff"}
        />
      </Card>

      {/* Frequency picker (only when enabled) */}
      {enabled && (
        <Card className="mb-4">
          <Text className="text-xs text-navy-300 font-semibold mb-3 uppercase tracking-wide">How often?</Text>
          <View className="gap-3">
            {FREQ_OPTIONS.map((opt) => (
              <Pressable
                key={opt.value}
                onPress={() => setFrequency(opt.value)}
                className={`flex-row items-center gap-3 p-3 rounded-2xl border ${
                  frequency === opt.value ? "border-blush-400 bg-blush-50" : "border-transparent"
                }`}
              >
                <View className={`w-4 h-4 rounded-full border-2 ${
                  frequency === opt.value ? "border-blush-500 bg-blush-500" : "border-navy-200"
                }`} />
                <View>
                  <Text className="font-semibold text-navy-500 text-sm">{opt.label}</Text>
                  <Text className="text-xs text-navy-300">{opt.desc}</Text>
                </View>
              </Pressable>
            ))}
          </View>
        </Card>
      )}

      <Button variant="primary" onPress={handleSave} disabled={saving}>
        <Text className="text-white font-bold">{saving ? "Saving…" : "Save settings"}</Text>
      </Button>
    </View>
  );
}
```

---

## Phase 6 — Settings Screen (global notification prefs)

```tsx
// app/(tabs)/settings.tsx
// Global: quiet hours, digest on/off, currency, payday date.
// Also entry point to: manage collections, notification prefs per collection.

import { View, ScrollView, Switch, TextInput } from "react-native";
import { router } from "expo-router";
import { useState } from "react";
import { useAppStore } from "~/lib/store";
import { supabase } from "~/lib/supabase";
import { Text } from "~/components/ui/text";
import { Card } from "~/components/ui/card";
import { Button } from "~/components/ui/button";

export default function SettingsScreen() {
  const notifPrefs   = useAppStore((s) => s.notifPrefs);
  const setNotifPrefs = useAppStore((s) => s.setNotifPrefs);

  const [globalEnabled, setGlobalEnabled] = useState(notifPrefs?.global_enabled ?? true);
  const [quietStart,    setQuietStart]    = useState(notifPrefs?.quiet_hours_start ?? "22:00");
  const [quietEnd,      setQuietEnd]      = useState(notifPrefs?.quiet_hours_end   ?? "08:00");
  const [digestEnabled, setDigestEnabled] = useState(notifPrefs?.notify_digest ?? false);

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.replace("/(auth)/sign-in");
  }

  return (
    <ScrollView className="flex-1 bg-cream" contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 64, paddingBottom: 48, gap: 12 }}>
      <Text className="text-2xl font-display text-navy-500 mb-2">Settings ⚙️</Text>

      {/* Collections */}
      <Card>
        <Text className="font-semibold text-navy-500 mb-1">Collections</Text>
        <Text className="text-xs text-navy-300 mb-3">Create and manage your wish categories</Text>
        <Button variant="ghost" onPress={() => router.push("/collections/manage")}>
          <Text className="text-navy-500 font-semibold">Manage collections →</Text>
        </Button>
      </Card>

      {/* Notification master switch */}
      <Card>
        <Text className="font-semibold text-navy-500 mb-3">Notifications</Text>
        <View className="flex-row items-center justify-between mb-4">
          <Text className="text-sm text-navy-400">Enable all notifications</Text>
          <Switch
            value={globalEnabled}
            onValueChange={setGlobalEnabled}
            trackColor={{ true: "#F2C4CE" }}
            thumbColor={globalEnabled ? "#062045" : "#fff"}
          />
        </View>

        {globalEnabled && (
          <>
            <Text className="text-xs text-navy-300 font-semibold mb-2 uppercase tracking-wide">Quiet hours</Text>
            <View className="flex-row gap-3 mb-4">
              <View className="flex-1">
                <Text className="text-xs text-navy-300 mb-1">From</Text>
                <TextInput value={quietStart} onChangeText={setQuietStart} placeholder="22:00"
                  className="border border-blush-200 rounded-xl px-3 py-2 text-navy-500" />
              </View>
              <View className="flex-1">
                <Text className="text-xs text-navy-300 mb-1">Until</Text>
                <TextInput value={quietEnd} onChangeText={setQuietEnd} placeholder="08:00"
                  className="border border-blush-200 rounded-xl px-3 py-2 text-navy-500" />
              </View>
            </View>

            <View className="flex-row items-center justify-between">
              <View>
                <Text className="text-sm text-navy-400">Weekly digest</Text>
                <Text className="text-xs text-navy-300">A weekly "still want these?" roundup</Text>
              </View>
              <Switch
                value={digestEnabled}
                onValueChange={setDigestEnabled}
                trackColor={{ true: "#F2C4CE" }}
                thumbColor={digestEnabled ? "#062045" : "#fff"}
              />
            </View>
          </>
        )}
      </Card>

      <Button variant="ghost" onPress={handleSignOut} className="mt-4">
        <Text className="text-navy-400">Sign out</Text>
      </Button>
    </ScrollView>
  );
}
```

---

## Phase 7 — Stats Screen

```tsx
// app/(tabs)/stats.tsx
// - Total money not spent (forgot items × price)
// - Regret score average over time
// - Collection breakdown (impulse buy % per collection)
// - "Bought anyway" list with regret score
// Pull from useAppStore, compute derived stats inline.
// Use Native Reusables Progress bars per collection.
```

> Full implementation follows the same pattern as other screens. Data comes from `useAppStore().items`.

---

## Phase 8 — Share Extension (link capture)

### 8.1 Expo deep link approach (MVP)

```json
// app.json
{
  "expo": {
    "scheme": "waitout",
    "plugins": [
      ["expo-notifications", { "icon": "./assets/notification-icon.png" }]
    ]
  }
}
```

```ts
// lib/share-handler.ts
import * as Linking from "expo-linking";
import { router } from "expo-router";

export function setupShareHandler() {
  Linking.addEventListener("url", ({ url }) => {
    const parsed = Linking.parse(url);
    if (parsed.path === "add") {
      router.push({
        pathname: "/add-item",
        params: {
          url:   parsed.queryParams?.url   as string,
          title: parsed.queryParams?.title as string,
        },
      });
    }
  });
}
```

### 8.2 Clipboard detection (fallback)

On app foreground, check if clipboard holds a URL and offer to add it:

```ts
import * as Clipboard from "expo-clipboard";
import { useAppState } from "@react-native-community/hooks";

// In the Waiting screen's useEffect:
useAppState(async (state) => {
  if (state === "active") {
    const text = await Clipboard.getStringAsync();
    if (text.startsWith("http") && !lastClipboard.current === text) {
      lastClipboard.current = text;
      // Show a small bottom banner: "Add this link to your wait list?"
    }
  }
});
```

### 8.3 Native share extension (post-MVP)

```bash
npx expo prebuild
# Add Share Extension target in Xcode (Swift) and Activity in Android (Kotlin)
# Bridge back to RN via expo-modules-core
```

---

## Phase 9 — Polish & Aesthetic Details

| Detail | Implementation |
|--------|----------------|
| Font | Outfit (replaces Nunito — cleaner geometry, same warmth) |
| Haptic on every tap | `Haptics.selectionAsync()` on list items, `Haptics.impactAsync(Medium)` on save |
| Smooth card entrance | `Animated.FadeIn` from `react-native-reanimated` |
| Image loading | `expo-image` with blur placeholder from Supabase signed URL |
| Empty state art | SVG illustration of a shopping bag with a pause button, blush tones |
| Notification icon | Simple `⏸` on blush circle background |
| App icon | Blush background, small navy pause symbol |
| Splash screen | Cream bg, centered wordmark in Outfit ExtraBold navy |
| Pull to refresh | Native RefreshControl, tint `#F2C4CE`, re-fetches from Supabase |
| Offline banner | Detect `NetInfo.isConnected`, show soft warning if offline |

---

## Phase 10 — Build & Deploy

```bash
npm install -g eas-cli
eas login
eas build:configure

# Dev build (required for notifications — Expo Go won't work)
eas build --profile development --platform ios

# Production
eas build --profile production --platform all
eas submit
```

### app.json essentials

```json
{
  "expo": {
    "name":    "Pausy",
    "slug":    "pausy",
    "version": "1.0.0",
    "scheme":  "waitout",
    "icon":    "./assets/icon.png",
    "splash": {
      "image":           "./assets/splash.png",
      "backgroundColor": "#fdf8f5"
    },
    "plugins": [
      "expo-router",
      ["expo-notifications", {
        "icon":  "./assets/notification-icon.png",
        "color": "#F2C4CE"
      }],
      ["expo-image-picker", {
        "photosPermission": "Pausy uses your photos to save screenshots of things you want."
      }]
    ],
    "ios": {
      "supportsTablet":   false,
      "bundleIdentifier": "com.yourname.waitout"
    },
    "android": {
      "package": "com.yourname.waitout",
      "adaptiveIcon": {
        "foregroundImage":  "./assets/adaptive-icon.png",
        "backgroundColor":  "#F2C4CE"
      }
    }
  }
}
```

---

## Quick Reference — Key Decisions

| Decision | Choice | Reason |
|----------|--------|--------|
| Framework | Expo + Expo Router | File-based routing, EAS builds, share extension support |
| Styling | NativeWind v4 | Tailwind syntax, no StyleSheet boilerplate |
| Components | Native Reusables | Accessible, customisable, saves weeks of work |
| **Font** | **Outfit** | Cleaner geometry than Nunito, same friendly personality |
| **Backend** | **Supabase** | Auth, Postgres, realtime, Storage for images — all in one |
| **State** | **Zustand (optimistic cache) + Supabase** | Instant UI, real persistence, cross-device sync |
| **Entry fields** | **Title, notes, price, TikTok URL, Insta URL, site URL, image** | Rich context = better regret scoring + recall |
| **Collections** | **User-defined, emoji + name, per-collection notif settings** | Maximum personalisation without complexity |
| **Notifications** | **Per-collection frequency: on-schedule / daily / weekly / never** | User controls the cadence, not us |
| Notifications delivery | Push first, email as fallback | Impulse control needs real-time nudges |
| ML model | Weighted score → logistic regression | Ship fast, improve with real data |

---

> 🎀 *Built for the girlies who screenshot things at midnight and regret it by Friday.*
