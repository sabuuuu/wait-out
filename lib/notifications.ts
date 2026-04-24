import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { Collection, NotificationPrefs, WishlistItem } from "./types";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function requestPermissions() {
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("wait-it-out", {
      name: "Wait It Out reminders",
      importance: Notifications.AndroidImportance.HIGH,
    });
  }
  const permissions = await Notifications.requestPermissionsAsync() as any;
  return permissions.status === "granted" || permissions.granted;
}

export async function registerNotificationCategories() {
  await Notifications.setNotificationCategoryAsync("ITEM_REMINDER", [
    { identifier: "FORGOT", buttonTitle: "I forgot it", options: { isDestructive: false } },
    { identifier: "STILL_WANT", buttonTitle: "Still want it", options: { isDestructive: false } },
    { identifier: "SNOOZE", buttonTitle: "One more week", options: { isDestructive: false } },
  ]);
}

export async function scheduleReminder(
  item: WishlistItem,
  globalPrefs: NotificationPrefs | null,
  collection?: Collection
): Promise<string | null> {
  if (globalPrefs && !globalPrefs.global_enabled) return null;
  if (collection && !collection.notif_enabled) return null;
  if (collection && collection.notif_frequency !== "on_schedule") return null;

  const trigger = new Date(item.remind_at);
  const notifId = await Notifications.scheduleNotificationAsync({
    content: {
      title: "Still want it?",
      body: `${item.title}${item.price ? ` - ${item.currency}${item.price}` : ""}. Do you still care?`,
      data: { itemId: item.id },
      categoryIdentifier: "ITEM_REMINDER",
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: trigger,
    },
  });
  return notifId;
}

export async function cancelReminder(notifId: string) {
  await Notifications.cancelScheduledNotificationAsync(notifId);
}

export async function scheduleDigest(collection: Collection) {
  if (!collection.notif_enabled) return;
  if (collection.notif_frequency === "on_schedule" || collection.notif_frequency === "never") return;

  const trigger: Notifications.NotificationTriggerInput =
    collection.notif_frequency === "daily_digest"
      ? {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: parseInt(collection.notif_time?.split(":")[0] ?? "9"),
        minute: parseInt(collection.notif_time?.split(":")[1] ?? "0"),
        repeats: true,
      } as any
      : {
        type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
        weekday: (collection.notif_weekday ?? 1) + 1,
        hour: parseInt(collection.notif_time?.split(":")[0] ?? "9"),
        minute: parseInt(collection.notif_time?.split(":")[1] ?? "0"),
        repeats: true,
      } as any;

  await Notifications.scheduleNotificationAsync({
    content: {
      title: `${collection.name} check-in`,
      body: "Time to review your waiting list",
      data: { collectionId: collection.id, type: "digest" },
    },
    trigger,
  });
}
