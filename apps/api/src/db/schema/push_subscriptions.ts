import { pgTable, uuid, text, timestamp, jsonb } from 'drizzle-orm/pg-core';

/**
 * Table storing Web Push subscription data for each user.
 * Used by the NotificationService to send push notifications.
 */
export const pushSubscriptions = pgTable('push_subscriptions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull(),
  endpoint: text('endpoint').notNull(),
  keys: jsonb('keys').notNull(), // { p256dh: string, auth: string }
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
