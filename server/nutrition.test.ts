import { describe, expect, it } from "vitest";
import { defaultFoods, defaultHomeDiet, normalizeState } from "../client/src/lib/localStore";

describe("P3 nutrition defaults", () => {
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
});
