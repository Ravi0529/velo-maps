import { pgTable, uuid, text, timestamp } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),

  email: text("email").notNull().unique(),
  name: text("name").notNull(),

  avatar: text("avatar"),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  lastSeen: timestamp("last_seen"),
});
