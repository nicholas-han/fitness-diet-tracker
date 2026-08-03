import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, json } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ─── Workout Logs ────────────────────────────────────────────────────────────
// Each row represents a claimed workout day. The `data` column stores the full
// workout session JSON (exercises, sets, weights, reps) as an editable copy.
export const workoutLogs = mysqlTable("workout_logs", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  date: varchar("date", { length: 10 }).notNull(), // YYYY-MM-DD format
  templateId: varchar("templateId", { length: 64 }).notNull(),
  templateTitle: varchar("templateTitle", { length: 128 }).notNull(),
  category: mysqlEnum("category", ["main", "core", "cardio"]).notNull(),
  intensity: mysqlEnum("intensity", ["high", "medium", "low"]).notNull(),
  data: json("data").notNull(), // Full workout session JSON (sessions, exercises, sets)
  completed: mysqlEnum("completed", ["pending", "in_progress", "completed"]).default("pending").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type WorkoutLog = typeof workoutLogs.$inferSelect;
export type InsertWorkoutLog = typeof workoutLogs.$inferInsert;

// ─── Diet Logs ───────────────────────────────────────────────────────────────
// Each row represents a claimed diet day. The `data` column stores the full
// meal template JSON (ingredients, amounts, macros) as an editable copy.
export const dietLogs = mysqlTable("diet_logs", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  date: varchar("date", { length: 10 }).notNull(), // YYYY-MM-DD format
  templateId: varchar("templateId", { length: 64 }).notNull(),
  templateLabel: varchar("templateLabel", { length: 128 }).notNull(),
  dayType: mysqlEnum("dayType", ["training", "rest"]).notNull(),
  data: json("data").notNull(), // Full meal data JSON (rice, hardyVeg, meat, greenVeg, seasoning, etc.)
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type DietLog = typeof dietLogs.$inferSelect;
export type InsertDietLog = typeof dietLogs.$inferInsert;
