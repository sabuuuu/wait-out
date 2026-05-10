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
    await Notifications.setNotificationChannelAsync("pausy", {
      name: "Pausy reminders",
      importance: Notifications.AndroidImportance.HIGH,
    });
  }
  const { status, granted } = await Notifications.requestPermissionsAsync();
  return status === "granted" || granted;
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

  // Enforce quiet hours — if the reminder falls inside the quiet window,
  // reschedule it to fire at the end of quiet hours on the same day.
  let trigger = new Date(item.remind_at);
  if (globalPrefs) {
    trigger = adjustForQuietHours(trigger, globalPrefs);
  }

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

/**
 * If `date` falls within the user's quiet hours window, push it forward
 * to the quiet hours end time on the same (or next) day.
 *
 * Quiet hours are stored as "HH:MM" strings (e.g. "22:00", "08:00").
 * Handles overnight windows (e.g. 22:00 → 08:00).
 */
function adjustForQuietHours(date: Date, prefs: NotificationPrefs): Date {
  const [startH, startM] = prefs.quiet_hours_start.split(":").map(Number);
  const [endH, endM]     = prefs.quiet_hours_end.split(":").map(Number);

  const startMins = startH * 60 + startM;
  const endMins   = endH   * 60 + endM;
  const dateMins  = date.getHours() * 60 + date.getMinutes();

  const isOvernight = startMins > endMins; // e.g. 22:00 → 08:00

  const inQuietHours = isOvernight
    ? dateMins >= startMins || dateMins < endMins   // wraps midnight
    : dateMins >= startMins && dateMins < endMins;  // same day

  if (!inQuietHours) return date;

  // Push to quiet hours end time
  const adjusted = new Date(date);
  adjusted.setHours(endH, endM, 0, 0);

  // If the end time is earlier in the day and we're past midnight in the
  // overnight window, the end is already today — otherwise push to tomorrow
  if (isOvernight && dateMins >= startMins) {
    adjusted.setDate(adjusted.getDate() + 1);
  }

  return adjusted;
}

export async function cancelReminder(notifId: string) {
  await Notifications.cancelScheduledNotificationAsync(notifId);
}

export async function scheduleDigest(collection: Collection) {
  if (!collection.notif_enabled) return;
  if (collection.notif_frequency === "on_schedule" || collection.notif_frequency === "never") return;

  const hour   = parseInt(collection.notif_time?.split(":")[0] ?? "9",  10);
  const minute = parseInt(collection.notif_time?.split(":")[1] ?? "0",  10);

  // NativeDailyTriggerInput and NativeWeeklyTriggerInput are always repeating
  // by design — they don't have a `repeats` field. The previous `as any` cast
  // was masking this: the field was simply wrong and can be removed.
  const trigger: Notifications.NotificationTriggerInput =
    collection.notif_frequency === "daily_digest"
      ? {
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          hour,
          minute,
        }
      : {
          type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
          weekday: (collection.notif_weekday ?? 1) + 1,
          hour,
          minute,
        };

  await Notifications.scheduleNotificationAsync({
    content: {
      title: `${collection.name} check-in`,
      body: "Time to review your waiting list",
      data: { collectionId: collection.id, type: "digest" },
    },
    trigger,
  });
}
