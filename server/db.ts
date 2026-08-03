import { eq, and, desc, gte, lte } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, workoutLogs, dietLogs, WorkoutLog, DietLog, InsertWorkoutLog, InsertDietLog } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// ─── Workout Log Queries ─────────────────────────────────────────────────────

export async function createWorkoutLog(log: InsertWorkoutLog): Promise<WorkoutLog> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(workoutLogs).values(log);
  const inserted = await db.select().from(workoutLogs).where(eq(workoutLogs.id, result[0].insertId)).limit(1);
  return inserted[0];
}

export async function getWorkoutLogsByDate(userId: number, date: string): Promise<WorkoutLog[]> {
  const db = await getDb();
  if (!db) return [];

  const result = await db.select().from(workoutLogs).where(
    and(eq(workoutLogs.userId, userId), eq(workoutLogs.date, date))
  ).orderBy(workoutLogs.createdAt);
  return result;
}

export async function getWorkoutLogById(id: number, userId: number): Promise<WorkoutLog | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(workoutLogs).where(
    and(eq(workoutLogs.id, id), eq(workoutLogs.userId, userId))
  ).limit(1);
  return result[0];
}

export async function listWorkoutLogs(userId: number, limit = 30): Promise<WorkoutLog[]> {
  const db = await getDb();
  if (!db) return [];

  const result = await db.select().from(workoutLogs).where(eq(workoutLogs.userId, userId)).orderBy(desc(workoutLogs.date)).limit(limit);
  return result;
}

export async function updateWorkoutLogData(id: number, userId: number, data: unknown, completed?: string): Promise<void> {
  const db = await getDb();
  if (!db) return;

  const updateData: Record<string, unknown> = { data };
  if (completed) updateData.completed = completed;

  await db.update(workoutLogs).set(updateData).where(
    and(eq(workoutLogs.id, id), eq(workoutLogs.userId, userId))
  );
}

export async function deleteWorkoutLog(id: number, userId: number): Promise<void> {
  const db = await getDb();
  if (!db) return;

  await db.delete(workoutLogs).where(
    and(eq(workoutLogs.id, id), eq(workoutLogs.userId, userId))
  );
}

// Build a map of exerciseName -> { weight, reps, unit } from the most recent log
// that has non-zero weight or reps for that exercise.
export async function getLastExerciseStats(userId: number): Promise<Record<string, { weight: number; reps: number; unit: string }>> {
  const db = await getDb();
  if (!db) return {};

  const logs = await db.select().from(workoutLogs)
    .where(eq(workoutLogs.userId, userId))
    .orderBy(desc(workoutLogs.date))
    .limit(200);

  const result: Record<string, { weight: number; reps: number; unit: string }> = {};

  for (const log of logs) {
    const data = log.data as any;
    if (!data?.sessions) continue;
    for (const session of data.sessions) {
      if (!session?.exercises) continue;
      for (const ex of session.exercises) {
        if (!ex?.name || !ex?.sets) continue;
        // Only set if not already found (first = most recent due to desc order)
        if (result[ex.name]) continue;
        // Only use sets that were actually performed (done=true) by the user
        // This ignores untouched template defaults from claimed-but-never-performed workouts
        for (const set of ex.sets) {
          if (set.done && ((set.weight && set.weight > 0) || (set.reps && set.reps > 0))) {
            result[ex.name] = {
              weight: set.weight || 0,
              reps: set.reps || 0,
              unit: set.unit || "kg",
            };
            break;
          }
        }
      }
    }
  }

  return result;
}

// ─── Diet Log Queries ────────────────────────────────────────────────────────

export async function createDietLog(log: InsertDietLog): Promise<DietLog> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(dietLogs).values(log);
  const inserted = await db.select().from(dietLogs).where(eq(dietLogs.id, result[0].insertId)).limit(1);
  return inserted[0];
}

export async function getDietLogByDate(userId: number, date: string): Promise<DietLog | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(dietLogs).where(
    and(eq(dietLogs.userId, userId), eq(dietLogs.date, date))
  ).limit(1);
  return result[0];
}

export async function getDietLogById(id: number, userId: number): Promise<DietLog | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(dietLogs).where(
    and(eq(dietLogs.id, id), eq(dietLogs.userId, userId))
  ).limit(1);
  return result[0];
}

export async function listDietLogs(userId: number, limit = 30): Promise<DietLog[]> {
  const db = await getDb();
  if (!db) return [];

  const result = await db.select().from(dietLogs).where(eq(dietLogs.userId, userId)).orderBy(desc(dietLogs.date)).limit(limit);
  return result;
}

export async function updateDietLogData(id: number, userId: number, data: unknown): Promise<void> {
  const db = await getDb();
  if (!db) return;

  await db.update(dietLogs).set({ data }).where(
    and(eq(dietLogs.id, id), eq(dietLogs.userId, userId))
  );
}

export async function deleteDietLog(id: number, userId: number): Promise<void> {
  const db = await getDb();
  if (!db) return;

  await db.delete(dietLogs).where(
    and(eq(dietLogs.id, id), eq(dietLogs.userId, userId))
  );
}
