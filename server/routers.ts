import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import {
  createWorkoutLog,
  getWorkoutLogsByDate,
  getWorkoutLogById,
  listWorkoutLogs,
  updateWorkoutLogData,
  deleteWorkoutLog,
  getLastExerciseStats,
  createDietLog,
  getDietLogByDate,
  getDietLogById,
  listDietLogs,
  updateDietLogData,
  deleteDietLog,
} from "./db";
import { WORKOUT_TEMPLATES } from "../shared/workoutTemplates";
import { MEAL_TEMPLATES } from "../shared/mealTemplates";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // ─── Workout Templates ─────────────────────────────────────────────────────
  workout: router({
    templates: protectedProcedure.query(() => {
      return WORKOUT_TEMPLATES;
    }),

    claim: protectedProcedure
      .input(z.object({
        date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
        templateId: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        const template = WORKOUT_TEMPLATES.find(t => t.id === input.templateId);
        if (!template) throw new Error("Template not found");

        // Allow multiple workouts per day (e.g., strength + cardio)
        // No "already claimed" check — user can claim as many templates as needed

        // Fetch last-used weight/reps per exercise from history
        const lastStats = await getLastExerciseStats(ctx.user.id);

        const log = await createWorkoutLog({
          userId: ctx.user.id,
          date: input.date,
          templateId: template.id,
          templateTitle: template.title,
          category: template.category,
          intensity: template.intensity,
          data: {
            sessions: ([template.sessionA, template.sessionB].filter(Boolean) as NonNullable<typeof template.sessionA>[]).map(s => ({
              title: s.label,
              type: s.type,
              durationMin: s.durationMin,
              exercises: [
                ...s.warmup,
                ...s.main,
                ...s.cooldown,
              ].map(e => ({
                name: e.name,
                desc: e.desc,
                exerciseType: e.type,
                reps: e.reps || "",
                sets: e.sets.map(set => {
                  const last = lastStats[e.name];
                  const hasHistory = last && (last.weight > 0 || last.reps > 0);
                  return {
                    weight: hasHistory ? last.weight : (set.targetWeight || 0),
                    reps: hasHistory ? last.reps : 0,
                    unit: hasHistory ? last.unit : "kg",
                    targetReps: set.targetReps,
                    isBodyweight: set.isBodyweight || false,
                    isTimed: set.isTimed || false,
                    isDistance: set.isDistance || false,
                    done: false,
                    fromHistory: !!hasHistory, // flag for UI to show in gray
                  };
                }),
              })),
            })),
          },
          completed: "pending",
        });

        return log;
      }),

    getByDate: protectedProcedure
      .input(z.object({ date: z.string() }))
      .query(async ({ ctx, input }) => {
        return await getWorkoutLogsByDate(ctx.user.id, input.date);
      }),

    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        return await getWorkoutLogById(input.id, ctx.user.id);
      }),

    list: protectedProcedure
      .input(z.object({ limit: z.number().optional() }).optional())
      .query(async ({ ctx, input }) => {
        return await listWorkoutLogs(ctx.user.id, input?.limit ?? 30);
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        data: z.any(),
        completed: z.enum(["pending", "in_progress", "completed"]).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        await updateWorkoutLogData(input.id, ctx.user.id, input.data, input.completed);
        return { success: true };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await deleteWorkoutLog(input.id, ctx.user.id);
        return { success: true };
      }),
  }),

  // ─── Diet Templates ────────────────────────────────────────────────────────
  diet: router({
    templates: protectedProcedure.query(() => {
      return MEAL_TEMPLATES;
    }),

    claim: protectedProcedure
      .input(z.object({
        date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
        templateId: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        const template = MEAL_TEMPLATES.find(t => t.id === input.templateId);
        if (!template) throw new Error("Template not found");

        // Check if already claimed for this date
        const existing = await getDietLogByDate(ctx.user.id, input.date);
        if (existing) throw new Error("Already claimed a diet plan for this date");

        const log = await createDietLog({
          userId: ctx.user.id,
          date: input.date,
          templateId: template.id,
          templateLabel: template.label,
          dayType: template.dayType,
          data: {
            rice: template.rice,
            hardyVeg: template.hardyVeg,
            meat: template.meat,
            greenVeg: template.greenVeg,
            seasoning: template.seasoning,
            tips: template.tips,
            totalKcal: template.totalKcal,
            macros: template.macros,
            dayTotalKcal: template.dayTotalKcal,
            dayDeficit: template.dayDeficit,
          },
        });

        return log;
      }),

    getByDate: protectedProcedure
      .input(z.object({ date: z.string() }))
      .query(async ({ ctx, input }) => {
        return await getDietLogByDate(ctx.user.id, input.date);
      }),

    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        return await getDietLogById(input.id, ctx.user.id);
      }),

    list: protectedProcedure
      .input(z.object({ limit: z.number().optional() }).optional())
      .query(async ({ ctx, input }) => {
        return await listDietLogs(ctx.user.id, input?.limit ?? 30);
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        data: z.any(),
      }))
      .mutation(async ({ ctx, input }) => {
        await updateDietLogData(input.id, ctx.user.id, input.data);
        return { success: true };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await deleteDietLog(input.id, ctx.user.id);
        return { success: true };
      }),
  }),

  // ─── Data Export ───────────────────────────────────────────────────────────
  data: router({
    export: protectedProcedure.query(async ({ ctx }) => {
      const [workouts, diets] = await Promise.all([
        listWorkoutLogs(ctx.user.id, 1000),
        listDietLogs(ctx.user.id, 1000),
      ]);

      return {
        exportedAt: new Date().toISOString(),
        user: {
          id: ctx.user.id,
          name: ctx.user.name,
          email: ctx.user.email,
        },
        workoutLogs: workouts,
        dietLogs: diets,
      };
    }),
  }),
});

export type AppRouter = typeof appRouter;
