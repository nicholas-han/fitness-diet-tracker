import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

// Mock the db module
vi.mock("./db", () => ({
  createWorkoutLog: vi.fn(),
  getWorkoutLogsByDate: vi.fn(),
  getWorkoutLogById: vi.fn(),
  listWorkoutLogs: vi.fn(),
  updateWorkoutLogData: vi.fn(),
  deleteWorkoutLog: vi.fn(),
  getLastExerciseStats: vi.fn(),
  createDietLog: vi.fn(),
  getDietLogByDate: vi.fn(),
  getDietLogById: vi.fn(),
  listDietLogs: vi.fn(),
  updateDietLogData: vi.fn(),
  deleteDietLog: vi.fn(),
}));

import {
  createWorkoutLog,
  getWorkoutLogsByDate,
  listWorkoutLogs,
  updateWorkoutLogData,
  deleteWorkoutLog,
  getLastExerciseStats,
  createDietLog,
  getDietLogByDate,
  listDietLogs,
  updateDietLogData,
  deleteDietLog,
} from "./db";

function createAuthContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  return {
    user,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("workout.templates", () => {
  it("returns all workout templates", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.workout.templates();

    expect(result).toBeDefined();
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);
    const categories = new Set(result.map((t: any) => t.category));
    expect(categories.has("main")).toBe(true);
    expect(categories.has("core")).toBe(true);
    expect(categories.has("cardio")).toBe(true);
  });
});

describe("workout.claim", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("claims a workout template for a specific date", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    vi.mocked(getWorkoutLogsByDate).mockResolvedValue([]);
    vi.mocked(getLastExerciseStats).mockResolvedValue({});
    vi.mocked(createWorkoutLog).mockResolvedValue({
      id: 1,
      userId: 1,
      date: "2026-08-03",
      templateId: "chest_triceps",
      templateTitle: "胸+三头",
      category: "main",
      intensity: "high",
      data: { sessions: [] },
      completed: "pending",
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any);

    const result = await caller.workout.claim({
      date: "2026-08-03",
      templateId: "chest_triceps",
    });

    expect(result).toBeDefined();
    expect(result.templateId).toBe("chest_triceps");
    expect(result.templateTitle).toBe("胸+三头");
    expect(createWorkoutLog).toHaveBeenCalledOnce();
  });

  it("allows claiming a second template on the same date (strength + cardio)", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Simulate existing workout already claimed for this date
    vi.mocked(getWorkoutLogsByDate).mockResolvedValue([
      {
        id: 1,
        userId: 1,
        date: "2026-08-03",
        templateId: "chest_triceps",
        templateTitle: "胸+三头",
        category: "main",
        intensity: "high",
        data: { sessions: [] },
        completed: "pending",
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any,
    ]);
    vi.mocked(getLastExerciseStats).mockResolvedValue({});
    vi.mocked(createWorkoutLog).mockResolvedValue({
      id: 2,
      userId: 1,
      date: "2026-08-03",
      templateId: "cardio_running",
      templateTitle: "有氧训练：跑步",
      category: "cardio",
      intensity: "medium",
      data: { sessions: [] },
      completed: "pending",
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any);

    const result = await caller.workout.claim({
      date: "2026-08-03",
      templateId: "cardio_running",
    });

    // Should succeed — no "Already claimed" error
    expect(result).toBeDefined();
    expect(result.templateId).toBe("cardio_running");
    expect(result.category).toBe("cardio");
    expect(createWorkoutLog).toHaveBeenCalledOnce();
  });

  it("throws for invalid template ID", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    vi.mocked(getWorkoutLogsByDate).mockResolvedValue([]);
    vi.mocked(getLastExerciseStats).mockResolvedValue({});

    await expect(
      caller.workout.claim({ date: "2026-08-03", templateId: "non-existent" })
    ).rejects.toThrow("Template not found");
  });

  it("includes unit field (default 'kg') in claimed set data", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    vi.mocked(getWorkoutLogsByDate).mockResolvedValue([]);
    vi.mocked(getLastExerciseStats).mockResolvedValue({});
    vi.mocked(createWorkoutLog).mockResolvedValue({
      id: 1,
      userId: 1,
      date: "2026-08-03",
      templateId: "chest_triceps",
      templateTitle: "胸+三头",
      category: "main",
      intensity: "high",
      data: {
        sessions: [{
          title: "主训练",
          exercises: [{
            name: "卧推",
            sets: [{ weight: 60, reps: 0, unit: "kg", done: false }],
          }],
        }],
      },
      completed: "pending",
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any);

    const result = await caller.workout.claim({
      date: "2026-08-03",
      templateId: "chest_triceps",
    });

    // Verify the createWorkoutLog was called with data containing unit field
    const callArg = vi.mocked(createWorkoutLog).mock.calls[0][0] as any;
    const sessions = callArg.data.sessions;
    expect(sessions).toBeDefined();
    expect(sessions.length).toBeGreaterThan(0);
    // Check that at least one set has unit: "kg"
    let foundUnit = false;
    for (const s of sessions) {
      for (const ex of s.exercises) {
        for (const set of ex.sets) {
          if (set.unit === "kg") foundUnit = true;
        }
      }
    }
    expect(foundUnit).toBe(true);
  });
});

describe("workout.getByDate", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns an array of workout logs for the date", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    vi.mocked(getWorkoutLogsByDate).mockResolvedValue([
      { id: 1, templateId: "chest_triceps", templateTitle: "胸+三头" } as any,
      { id: 2, templateId: "cardio_running", templateTitle: "跑步" } as any,
    ]);
    vi.mocked(getLastExerciseStats).mockResolvedValue({});

    const result = await caller.workout.getByDate({ date: "2026-08-03" });

    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBe(2);
  });

  it("returns empty array when no workouts claimed", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    vi.mocked(getWorkoutLogsByDate).mockResolvedValue([]);

    const result = await caller.workout.getByDate({ date: "2026-08-03" });

    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBe(0);
  });
});

describe("workout.update", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("updates workout log data", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    vi.mocked(updateWorkoutLogData).mockResolvedValue(undefined);

    const result = await caller.workout.update({
      id: 1,
      data: { sessions: [{ title: "Test", exercises: [] }] },
      completed: "completed",
    });

    expect(result).toEqual({ success: true });
    expect(updateWorkoutLogData).toHaveBeenCalledWith(1, 1, expect.any(Object), "completed");
  });
});

describe("workout.delete", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("deletes a workout log", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    vi.mocked(deleteWorkoutLog).mockResolvedValue(undefined);

    const result = await caller.workout.delete({ id: 1 });

    expect(result).toEqual({ success: true });
    expect(deleteWorkoutLog).toHaveBeenCalledWith(1, 1);
  });
});

describe("diet.templates", () => {
  it("returns all meal templates", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.diet.templates();

    expect(result).toBeDefined();
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBe(7);
    const dayTypes = new Set(result.map((t: any) => t.dayType));
    expect(dayTypes.has("training")).toBe(true);
    expect(dayTypes.has("rest")).toBe(true);
  });
});

describe("diet.claim", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("claims a diet template for a specific date", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    vi.mocked(getDietLogByDate).mockResolvedValue(undefined);
    vi.mocked(createDietLog).mockResolvedValue({
      id: 1,
      userId: 1,
      date: "2026-08-03",
      templateId: "training_1",
      templateLabel: "健身日 1",
      dayType: "training",
      data: { rice: {}, hardyVeg: [], meat: {}, greenVeg: {} },
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any);

    const result = await caller.diet.claim({
      date: "2026-08-03",
      templateId: "training_1",
    });

    expect(result).toBeDefined();
    expect(result.templateId).toBe("training_1");
    expect(result.dayType).toBe("training");
    expect(createDietLog).toHaveBeenCalledOnce();
  });

  it("throws if already claimed for the date", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    vi.mocked(getDietLogByDate).mockResolvedValue({
      id: 1,
      userId: 1,
      date: "2026-08-03",
      templateId: "training_1",
      templateLabel: "健身日 1",
      dayType: "training",
      data: {},
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any);

    await expect(
      caller.diet.claim({ date: "2026-08-03", templateId: "training_1" })
    ).rejects.toThrow("Already claimed");
  });
});

describe("diet.update", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("updates diet log data", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    vi.mocked(updateDietLogData).mockResolvedValue(undefined);

    const result = await caller.diet.update({
      id: 1,
      data: { rice: { name: "Rice", amount: "200g", kcal: 700, protein: 14, carbs: 150, fat: 2 } },
    });

    expect(result).toEqual({ success: true });
    expect(updateDietLogData).toHaveBeenCalledWith(1, 1, expect.any(Object));
  });
});

describe("data.export", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("exports all user data as JSON", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    vi.mocked(listWorkoutLogs).mockResolvedValue([]);
    vi.mocked(listDietLogs).mockResolvedValue([]);

    const result = await caller.data.export();

    expect(result).toBeDefined();
    expect(result.workoutLogs).toEqual([]);
    expect(result.dietLogs).toEqual([]);
    expect(result.user).toBeDefined();
    expect(result.user.id).toBe(1);
    expect(result.exportedAt).toBeDefined();
  });
});
