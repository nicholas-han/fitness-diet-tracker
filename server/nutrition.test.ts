import { describe, expect, it } from "vitest";
import { MEAL_TEMPLATES } from "@shared/mealTemplates";
import { defaultFoods, defaultHomeDiet, defaultState, defaultWeeklyMealPlan, generateGroceryList, normalizeState, recalculateMealTemplate, summarizeReview } from "../client/src/lib/localStore";

describe("nutrition and grocery planning", () => {
  it("ships an editable food catalog with separate nutrition and shopping units", () => {
    const foods = defaultFoods();
    expect(foods.map(food => food.id)).toContain("rice");
    expect(foods.find(food => food.id === "milk")?.nutritionUnit).toBe("100 ml");
    expect(foods.find(food => food.id === "milk")?.shoppingUnit).toBe("1 L 盒");
  });

  it("ships the Standard Home Diet baseline from the PRD", () => {
    expect(defaultHomeDiet()).toMatchObject({ chickenGrams: 325, eggs: 3, milkMl: 500, wheyScoops: 1, fruitServings: 2, fishSubstitutionDays: 2 });
  });

  it("backfills nutrition settings when loading a pre-P3 state", () => {
    const state = normalizeState({ version: 1, settings: { phase: "phase0" } } as any);
    expect(state.foods.length).toBeGreaterThan(0);
    expect(state.standardHomeDiet.riceGrams).toBe(200);
  });

  it("preserves an intentionally empty food catalog", () => {
    expect(normalizeState({ version: 1, foods: [] } as any).foods).toEqual([]);
  });

  it("recalculates template totals after ingredient edits", () => {
    const original = MEAL_TEMPLATES[0];
    const edited = { ...original, rice: { ...original.rice, kcal: original.rice.kcal + 100 } };
    const recalculated = recalculateMealTemplate(edited, original);
    expect(recalculated.totalKcal).toBe(original.totalKcal + 100);
    expect(recalculated.dayTotalKcal).toBe(original.dayTotalKcal + 100);
  });

  it("converts nutrition quantities to shopping packs and subtracts inventory", () => {
    const plan = { startDate: "2026-08-31", days: 1, dayPlans: [{ date: "2026-08-31", carbDay: "medium" as const, homeMeals: 2, socialMeals: 0 }] };
    const diet = { ...defaultHomeDiet(), fishSubstitutionDays: 0 };
    const list = generateGroceryList(defaultFoods(), diet, plan, [], [{ id: "milk-stock", foodId: "milk", quantity: 500, unit: "ml" }]);
    const chicken = list.find(item => item.foodId === "chicken-breast");
    const milk = list.find(item => item.foodId === "milk");
    expect(chicken).toMatchObject({ required: 325, toBuy: 325, purchase: "1 × 1 kg 包" });
    expect(milk).toMatchObject({ required: 500, available: 500, toBuy: 0, purchase: "库存充足" });
  });

  it("lets social meals reduce the generated home requirement", () => {
    const plan = { ...defaultWeeklyMealPlan("2026-08-31"), days: 1, dayPlans: [{ date: "2026-08-31", carbDay: "low" as const, homeMeals: 2, socialMeals: 2 }] };
    expect(generateGroceryList(defaultFoods(), { ...defaultHomeDiet(), fishSubstitutionDays: 0 }, plan, []).length).toBe(0);
  });

  it("applies fish substitutions even when every day uses a meal template", () => {
    const list = generateGroceryList(defaultFoods(), defaultHomeDiet(), defaultWeeklyMealPlan("2026-08-31"), MEAL_TEMPLATES);
    expect(list.find(item => item.foodId === "salmon")?.required).toBeGreaterThan(0);
  });

  it("uses template scaling, carb targets, and configurable fish substitutions", () => {
    const plan = { ...defaultWeeklyMealPlan("2026-08-31"), days: 1, dayPlans: [{ date: "2026-08-31", carbDay: "high" as const, homeMeals: 2, socialMeals: 0, templateId: MEAL_TEMPLATES[0].id, templateScale: 2 }] };
    const foods = [...defaultFoods(), { id: "mackerel", name: "鲭鱼", category: "蛋白质", nutritionUnit: "100 g", shoppingUnit: "500 g 包", shoppingPackSize: 500, shoppingPackUnit: "g", caloriesPerUnit: 200, proteinPerUnit: 20, carbsPerUnit: 0, fatPerUnit: 12 }];
    const list = generateGroceryList(foods, defaultHomeDiet(), plan, MEAL_TEMPLATES, [], { carbTargets: { low: { carbs: 180, calories: 2100 }, medium: { carbs: 260, calories: 2250 }, high: { carbs: 390, calories: 2600 } }, substitutionRules: { daysPerWeek: 1, foodIds: ["mackerel"] } });
    expect(list.find(item => item.foodId === "mackerel")?.required).toBeGreaterThan(0);
    expect(list.find(item => item.foodId === "rice")?.required).toBe(600);
    expect(list.find(item => item.foodId === "chicken-breast")?.required ?? 0).toBe(0);
  });

  it("summarizes review trends and adherence deterministically", () => {
    const state = defaultState();
    state.activities = [{ id: "a1", date: "2026-08-31", type: "strength", title: "Strength A", durationMin: 60, completed: true, sets: [{ exercise: "深蹲", weight: 80, reps: 8 }] }];
    state.body = [{ id: "b1", date: "2026-08-25", weight: 80, waist: 90 }, { id: "b2", date: "2026-08-31", weight: 79, waist: 89 }];
    state.nutrition = [{ id: "n1", date: "2026-08-31", homeMeals: 2, protein: 150, calories: 2200, carbs: 250, fat: 60, fruitServings: 2, vegetableServings: 4, carbDay: "medium" }];
    const summary = summarizeReview(state, "2026-08-25", "2026-08-31");
    expect(summary.body.weightTrend).toBe(-1);
    expect(summary.body.waistTrend).toBe(-1);
    expect(summary.nutrition.proteinAdherence).toBe(100);
    expect(summary.training.completed).toBe(1);
  });
});
