import { describe, expect, it } from "vitest";
import { addDays, defaultState, formatDate, generateGroceryList, normalizeState, startOfWeek, summarizeReview, validateStateSnapshot } from "./localStore";

describe("local calendar helpers", () => {
  it("formats dates using the user's local calendar", () => {
    const date = new Date(2026, 7, 31, 8, 15, 0);
    expect(formatDate(date)).toBe("2026-08-31");
  });

  it("calculates Monday-based weeks without UTC conversion", () => {
    expect(startOfWeek(new Date(2026, 7, 30, 8))).toBe("2026-08-24");
    expect(addDays("2026-08-24", 6)).toBe("2026-08-30");
  });

  it("upgrades P0 snapshots with the default editable strength programs", () => {
    const state = normalizeState({ version: 1, settings: { phase: "phase0" } } as any);
    expect(state.strengthPrograms.map(program => program.id)).toEqual(["strength-a", "strength-b", "strength-c"]);
  });

  it("rejects malformed backup collections and non-finite numeric values", () => {
    expect(validateStateSnapshot({ version: 1, settings: {}, body: {}, activities: [] })).toEqual([
      "body 必须是数组",
    ]);
    expect(validateStateSnapshot({ version: 1, settings: {}, body: [{ date: "2026-08-31", weight: NaN }] })).toContain("body[0].weight 必须是有限数字");
    expect(validateStateSnapshot({ version: 1, settings: { phase: "phase3" } })).toContain("settings.phase 配置不正确");
    expect(validateStateSnapshot({ version: 1, settings: { proteinSubstitution: { foodIds: ["salmon", 1] } } })).toContain("settings.proteinSubstitution.foodIds 必须是字符串数组");
  });

  it("accepts a complete empty backup", () => {
    expect(validateStateSnapshot({ version: 1, settings: {}, activities: [], body: [], recovery: [], nutrition: [] })).toEqual([]);
  });

  it("uses the configured phase duration in review summaries", () => {
    const state = defaultState();
    state.settings.phaseDurationWeeks = 8;
    state.settings.phaseStarted = "2026-01-01";
    expect(summarizeReview(state, "2026-02-20", "2026-02-20").phase.totalWeeks).toBe(8);
  });

  it("falls back from invalid imported phase values", () => {
    const state = normalizeState({ version: 1, settings: { phase: "phase3" } } as any);
    expect(state.settings.phase).toBe("phase0");
  });

  it("migrates legacy fish-substitution days into the new settings shape", () => {
    const state = normalizeState({ version: 1, settings: { phase: "phase0" }, standardHomeDiet: { fishSubstitutionDays: 5 } } as any);
    expect(state.settings.proteinSubstitution.daysPerWeek).toBe(5);
    expect(state.standardHomeDiet.fishSubstitutionDays).toBe(5);
  });

  it("counts claimed weekly tasks separately from extra sessions", () => {
    const state = defaultState();
    state.activities = [
      { id: "extra", date: "2026-08-31", type: "swimming", title: "额外游泳", durationMin: 30, completed: true },
      { id: "claimed", date: "2026-08-31", weeklyTaskId: "monday", planWeek: "2026-08-31", type: "strength", title: "Strength A", durationMin: 60, completed: true },
    ];
    const summary = summarizeReview(state, "2026-08-31", "2026-09-06");
    expect(summary.training.completed).toBe(1);
    expect(summary.training.extraSessions).toBe(1);
    expect(summary.training.adherence).toBe(14);
  });

  it("does not claim intake is at target when calories are above target", () => {
    const state = defaultState();
    state.nutrition = [
      { id: "n1", date: "2026-08-24", homeMeals: 2, calories: 3000, carbDay: "medium" },
      { id: "n2", date: "2026-08-31", homeMeals: 2, calories: 3000, carbDay: "medium" },
    ];
    state.body = [
      { id: "b1", date: "2026-08-24", weight: 80 },
      { id: "b2", date: "2026-08-31", weight: 81 },
    ];
    expect(summarizeReview(state, "2026-08-24", "2026-08-31").calibration.intakeWeightRelationship).toBe("weight-up-intake-above-target");
  });

  it("uses selected substitution foods and converts quantity to the food unit", () => {
    const homeDiet = { chickenGrams: 325, eggs: 0, milkMl: 0, wheyScoops: 0, riceGrams: 0, vegetableServings: 0, fruitServings: 0, fishSubstitutionDays: 1 };
    const grocery = generateGroceryList(defaultState().foods, homeDiet, { startDate: "2026-08-31", days: 1, dayPlans: [{ date: "2026-08-31", carbDay: "medium", homeMeals: 2, socialMeals: 0 }] }, [], [], { substitutionRules: { daysPerWeek: 1, foodIds: ["egg"] } });
    const eggs = grocery.find(item => item.foodId === "egg");
    expect(eggs?.unit).toBe("个");
    expect(eggs?.required).toBeGreaterThan(10);
    expect(grocery.find(item => item.foodId === "salmon")).toBeUndefined();
  });

  it("derives units from custom food definitions", () => {
    const customFood = { id: "turkey", name: "火鸡胸", category: "蛋白质", nutritionUnit: "100 g 生重", shoppingUnit: "500 g 包", shoppingPackSize: 500, shoppingPackUnit: "g", caloriesPerUnit: 120, proteinPerUnit: 25, carbsPerUnit: 0, fatPerUnit: 2 };
    const homeDiet = { chickenGrams: 325, eggs: 0, milkMl: 0, wheyScoops: 0, riceGrams: 0, vegetableServings: 0, fruitServings: 0, fishSubstitutionDays: 1 };
    const grocery = generateGroceryList([...defaultState().foods, customFood], homeDiet, { startDate: "2026-08-31", days: 1, dayPlans: [{ date: "2026-08-31", carbDay: "medium", homeMeals: 2, socialMeals: 0 }] }, [], [], { substitutionRules: { daysPerWeek: 1, foodIds: ["turkey"] } });
    const turkey = grocery.find(item => item.foodId === "turkey");
    expect(turkey).toMatchObject({ unit: "g", purchase: "1 × 500 g 包" });
    expect(turkey?.required).toBeCloseTo(299, 0);
  });

  it("parses compact custom nutrition units without letting pack units override them", () => {
    const customFood = { id: "turkey-compact", name: "火鸡胸（紧凑单位）", category: "蛋白质", nutritionUnit: "100g 生重", shoppingUnit: "500 g 包", shoppingPackSize: 500, shoppingPackUnit: "g", caloriesPerUnit: 120, proteinPerUnit: 25, carbsPerUnit: 0, fatPerUnit: 2 };
    const homeDiet = { chickenGrams: 325, eggs: 0, milkMl: 0, wheyScoops: 0, riceGrams: 0, vegetableServings: 0, fruitServings: 0, fishSubstitutionDays: 1 };
    const grocery = generateGroceryList([...defaultState().foods, customFood], homeDiet, { startDate: "2026-08-31", days: 1, dayPlans: [{ date: "2026-08-31", carbDay: "medium", homeMeals: 2, socialMeals: 0 }] }, [], [], { substitutionRules: { daysPerWeek: 1, foodIds: ["turkey-compact"] } });
    const turkey = grocery.find(item => item.foodId === "turkey-compact");
    expect(turkey?.unit).toBe("g");
    expect(turkey?.required).toBeCloseTo(299, 0);
  });
});
