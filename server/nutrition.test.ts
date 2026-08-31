import { describe, expect, it } from "vitest";
import { defaultFoods, defaultHomeDiet, defaultWeeklyMealPlan, generateGroceryList, normalizeState } from "../client/src/lib/localStore";

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
});
