export type DelayType = "3d" | "7d" | "2w" | "payday" | "custom";
export type ItemStatus = "waiting" | "bought" | "forgot" | "snoozed";
export type NotifFrequency = "on_schedule" | "daily_digest" | "weekly_digest" | "never";

export interface Collection {
  id: string;
  user_id: string;
  name: string;
  emoji: string;
  color?: string;
  sort_order: number;
  notif_enabled: boolean;
  notif_frequency: NotifFrequency;
  notif_time?: string;   // "HH:MM"
  notif_weekday?: number;   // 0–6
  created_at: string;
}

export interface WishlistItem {
  id: string;
  user_id: string;
  collection_id?: string;

  // Core
  title: string;
  notes?: string;
  price?: number;
  currency: string;

  // Source links
  source_url?: string;
  tiktok_url?: string;
  instagram_url?: string;

  // Image
  image_path?: string;
  image_url?: string;

  // Timing
  added_at: string;
  added_hour: number;
  delay_type: DelayType;
  remind_at: string;
  status: ItemStatus;

  // Score
  regret_score: number;
  score_factors?: ScoreFactors;

  notif_id?: string;
  updated_at: string;
}

export interface ScoreFactors {
  timeOfDay: number;
  priceVsAvg: number;
  categoryRisk: number;
  historyIgnored: number;
}

export interface NotificationPrefs {
  user_id: string;
  global_enabled: boolean;
  quiet_hours_start: string;
  quiet_hours_end: string;
  notify_on_remind: boolean;
  notify_digest: boolean;
  digest_frequency: "daily" | "weekly";
  digest_time: string;
  digest_weekday: number;
}
