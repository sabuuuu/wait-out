import { pgTable, uuid, text, integer, boolean, timestamp, numeric, jsonb, time, pgSchema, real } from "drizzle-orm/pg-core";
import { relations, sql } from "drizzle-orm";

export const authSchema = pgSchema("auth");

export const users = authSchema.table("users", {
  id: uuid("id").primaryKey(),
});

export const profiles = pgTable("profiles", {
  id: uuid("id").primaryKey().references(() => users.id, { onDelete: "cascade" }),
  displayName: text("display_name"),
  currency: text("currency").notNull().default("€"),
  paydayDay: integer("payday_day"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  lastModelTrainedAt: timestamp("last_model_trained_at", { withTimezone: true }),
});

export const collections = pgTable("collections", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => profiles.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  emoji: text("emoji").notNull().default("🛍️"),
  color: text("color"),
  sortOrder: integer("sort_order").notNull().default(0),
  notifEnabled: boolean("notif_enabled").notNull().default(true),
  notifFrequency: text("notif_frequency").notNull().default("on_schedule"),
  notifTime: text("notif_time"),
  notifWeekday: integer("notif_weekday"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const items = pgTable("items", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => profiles.id, { onDelete: "cascade" }),
  collectionId: uuid("collection_id").references(() => collections.id, { onDelete: "set null" }),

  title: text("title").notNull(),
  notes: text("notes"),
  price: numeric("price", { precision: 10, scale: 2 }),
  currency: text("currency").notNull().default("€"),

  sourceUrl: text("source_url"),
  tiktokUrl: text("tiktok_url"),
  instagramUrl: text("instagram_url"),

  imagePath: text("image_path"),

  addedAt: timestamp("added_at").notNull().defaultNow(),
  addedHour: integer("added_hour").notNull(),
  delayType: text("delay_type").notNull(),
  remindAt: timestamp("remind_at").notNull(),
  status: text("status").notNull().default("waiting"),

  regretScore: integer("regret_score").notNull().default(0),
  scoreFactors: jsonb("score_factors"),

  notifId: text("notif_id"),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),

  // V2: ML feature signals
  addedDayOfWeek: integer("added_day_of_week"),
  sessionItemsCount: integer("session_items_count").default(1),
  priceVsCatAvg: real("price_vs_cat_avg"),
  categorySlug: text("category_slug"),
  sourcePlatform: text("source_platform").default("unknown"),

  // V2: outcome label
  outcome: text("outcome"),
  outcomeSetAt: timestamp("outcome_set_at", { withTimezone: true }),
});

export const notificationPrefs = pgTable("notification_prefs", {
  userId: uuid("user_id").primaryKey().references(() => profiles.id, { onDelete: "cascade" }),
  globalEnabled: boolean("global_enabled").notNull().default(true),
  quietHoursStart: text("quiet_hours_start").default("22:00"),
  quietHoursEnd: text("quiet_hours_end").default("08:00"),
  notifyOnRemind: boolean("notify_on_remind").notNull().default(true),
  notifyDigest: boolean("notify_digest").notNull().default(false),
  digestFrequency: text("digest_frequency").default("weekly"),
  digestTime: text("digest_time").default("09:00"),
  digestWeekday: integer("digest_weekday").default(1),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Relations
export const profilesRelations = relations(profiles, ({ many, one }) => ({
  collections: many(collections),
  items: many(items),
  notificationPrefs: one(notificationPrefs, {
    fields: [profiles.id],
    references: [notificationPrefs.userId],
  }),
}));

export const collectionsRelations = relations(collections, ({ one, many }) => ({
  user: one(profiles, { fields: [collections.userId], references: [profiles.id] }),
  items: many(items),
}));

export const itemsRelations = relations(items, ({ one }) => ({
  user: one(profiles, { fields: [items.userId], references: [profiles.id] }),
  collection: one(collections, { fields: [items.collectionId], references: [collections.id] }),
}));
