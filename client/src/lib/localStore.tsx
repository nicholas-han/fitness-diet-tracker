import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { MEAL_TEMPLATES, type IngredientDetail, type MealTemplate } from "@shared/mealTemplates";
import { WORKOUT_TEMPLATES } from "@shared/workoutTemplates";
import { DEFAULT_STRENGTH_PROGRAMS, type CoreFocus, type StrengthProgram } from "@shared/strengthPrograms";
import { DEFAULT_WEEKLY_SCHEDULE, type WeeklyScheduleEntry } from "@shared/trainingPlan";

export type PhaseId = "phase0" | "phase1" | "phase2";
export type CarbDay = "low" | "medium" | "high";

export interface BodyEntry {
  id: string;
  date: string;
  weight?: number;
  waist?: number;
  bodyFat?: number;
  photoRef?: string;
}

export interface RecoveryEntry {
  id: string;
  date: string;
  sleepHours?: number;
  hrv?: number;
  restingHr?: number;
  whoopRecovery?: number;
  whoopStrain?: number;
  vo2max?: number;
  sleepConsistency?: number;
  fatigue?: number;
  soreness?: number;
  motivation?: number;
  hunger?: number;
  sleepQuality?: number;
  notes?: string;
}

export interface ActivityEntry {
  id: string;
  date: string;
  weeklyTaskId?: string;
  planWeek?: string;
  claimedAt?: string;
  type: WeeklyScheduleEntry["type"];
  title: string;
  durationMin: number;
  rpe?: number;
  distanceM?: number;
  strokeComposition?: string;
  freestyleM?: number;
  longestFreestyleM?: number;
  coreFocus?: CoreFocus;
  sessionType?: string;
  completed: boolean;
  notes?: string;
  sets?: ActivitySet[];
}

export interface ActivitySet {
  exercise: string;
  weight?: number;
  reps?: number;
  rir?: number;
  targetReps?: string;
  targetRir?: string;
  notes?: string;
}

export interface NutritionEntry {
  id: string;
  date: string;
  homeDietUsed?: boolean;
  templateId?: string;
  modifications?: string;
  homeMeals: number;
  socialMeal?: { type?: string; size?: string; highFat?: boolean; alcohol?: boolean; notes?: string };
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  riceGrams?: number;
  riceCups?: number;
  fruitServings?: number;
  vegetableServings?: number;
  carbDay: CarbDay;
  notes?: string;
}

export interface GroceryItem {
  id: string;
  foodId?: string;
  category: string;
  name: string;
  required: number;
  unit: string;
  purchase: string;
  checked: boolean;
  available?: number;
  toBuy?: number;
  notes?: string;
}

export interface FoodItem {
  id: string;
  name: string;
  category: string;
  nutritionUnit: string;
  shoppingUnit: string;
  shoppingPackSize?: number;
  shoppingPackUnit?: string;
  caloriesPerUnit: number;
  proteinPerUnit: number;
  carbsPerUnit: number;
  fatPerUnit: number;
  notes?: string;
}

export interface StandardHomeDiet {
  chickenGrams: number;
  eggs: number;
  milkMl: number;
  wheyScoops: number;
  riceGrams: number;
  vegetableServings: number;
  fruitServings: number;
  fishSubstitutionDays: number;
}

export interface WeeklyMealPlanDay {
  date: string;
  carbDay: CarbDay;
  homeMeals: number;
  socialMeals: number;
  templateId?: string;
  templateScale?: number;
}

export interface WeeklyMealPlan {
  startDate: string;
  days: number;
  dayPlans: WeeklyMealPlanDay[];
}

export interface InventoryItem {
  id: string;
  foodId: string;
  quantity: number;
  unit: string;
  expiryDate?: string;
  storage?: "frozen" | "refrigerated" | "pantry";
}

export interface FitnessState {
  version: 1;
  updatedAt?: string;
  settings: {
    name: string;
    heightCm: number;
    phase: PhaseId;
    phaseStarted: string;
    phaseDurationWeeks: number;
    targetWeight: number;
    targetBodyFat: number;
    riceCupGrams?: number;
    nutritionTargets: { calories: number; protein: number; carbs: number; fat: number; fruit: number; vegetables: number };
    carbTargets: Record<CarbDay, { carbs: number; calories: number }>;
    performanceBenchmarks: { squat?: number; bench?: number; pulling?: number; longestFreestyleM?: number };
    proteinSubstitution: { daysPerWeek: number; foodIds: string[] };
  };
  activities: ActivityEntry[];
  body: BodyEntry[];
  recovery: RecoveryEntry[];
  nutrition: NutritionEntry[];
  carbDayOverrides: Record<string, CarbDay>;
  grocery: GroceryItem[];
  groceryHistory: Array<{ date: string; items: GroceryItem[] }>;
  mealTemplates: MealTemplate[];
  foods: FoodItem[];
  standardHomeDiet: StandardHomeDiet;
  weeklyMealPlan: WeeklyMealPlan;
  inventory: InventoryItem[];
  strengthPrograms: StrengthProgram[];
  weeklySchedule: WeeklyScheduleEntry[];
  reviewNotes: Record<string, string>;
}

const KEY = "personal-fitness-os:v1";
const today = () => formatDate(new Date());
let persistQueue = Promise.resolve();

export const PHASES: Record<PhaseId, { label: string; subtitle: string; weeks: number }> = {
  phase0: { label: "Phase 0 — Reconditioning", subtitle: "重建训练、游泳和追踪习惯", weeks: 6 },
  phase1: { label: "Phase 1 — Recomposition / Cut", subtitle: "降低体脂，保持力量与运动表现", weeks: 12 },
  phase2: { label: "Phase 2 — Lean Gain", subtitle: "逐步增加瘦体重，控制体脂", weeks: 20 },
};

export const defaultState = (): FitnessState => ({
  version: 1,
  settings: {
    name: "我的 Fitness OS",
    heightCm: 188,
    phase: "phase0",
    phaseStarted: today(),
    phaseDurationWeeks: 6,
    targetWeight: 80,
    targetBodyFat: 14,
    nutritionTargets: { calories: 2250, protein: 145, carbs: 260, fat: 65, fruit: 2, vegetables: 4 },
    carbTargets: { low: { carbs: 180, calories: 2100 }, medium: { carbs: 260, calories: 2250 }, high: { carbs: 330, calories: 2450 } },
    performanceBenchmarks: {},
    proteinSubstitution: { daysPerWeek: 2, foodIds: ["salmon"] },
  },
  activities: [], body: [], recovery: [], nutrition: [], carbDayOverrides: {}, grocery: [], groceryHistory: [], mealTemplates: MEAL_TEMPLATES, foods: defaultFoods(), standardHomeDiet: defaultHomeDiet(), weeklyMealPlan: defaultWeeklyMealPlan(), inventory: [], strengthPrograms: DEFAULT_STRENGTH_PROGRAMS, weeklySchedule: DEFAULT_WEEKLY_SCHEDULE, reviewNotes: {},
});

export function defaultFoods(): FoodItem[] {
  return [
    { id: "chicken-breast", name: "鸡胸肉", category: "蛋白质", nutritionUnit: "100 g 生重", shoppingUnit: "1 kg 包", shoppingPackSize: 1000, shoppingPackUnit: "g", caloriesPerUnit: 110, proteinPerUnit: 23, carbsPerUnit: 0, fatPerUnit: 1.5 },
    { id: "salmon", name: "三文鱼", category: "蛋白质", nutritionUnit: "100 g", shoppingUnit: "500 g 包", shoppingPackSize: 500, shoppingPackUnit: "g", caloriesPerUnit: 208, proteinPerUnit: 20, carbsPerUnit: 0, fatPerUnit: 13 },
    { id: "egg", name: "鸡蛋", category: "蛋白质", nutritionUnit: "1 个", shoppingUnit: "12 个装", shoppingPackSize: 12, shoppingPackUnit: "个", caloriesPerUnit: 78, proteinPerUnit: 6.3, carbsPerUnit: 0.6, fatPerUnit: 5.3 },
    { id: "milk", name: "牛奶", category: "蛋白质", nutritionUnit: "100 ml", shoppingUnit: "1 L 盒", shoppingPackSize: 1000, shoppingPackUnit: "ml", caloriesPerUnit: 61, proteinPerUnit: 3.2, carbsPerUnit: 4.8, fatPerUnit: 3.3 },
    { id: "whey", name: "乳清蛋白", category: "蛋白质", nutritionUnit: "1 勺", shoppingUnit: "1 袋", shoppingPackSize: 30, shoppingPackUnit: "勺", caloriesPerUnit: 120, proteinPerUnit: 24, carbsPerUnit: 3, fatPerUnit: 2 },
    { id: "rice", name: "白米", category: "碳水", nutritionUnit: "100 g 生重", shoppingUnit: "2 kg 袋", shoppingPackSize: 2000, shoppingPackUnit: "g", caloriesPerUnit: 350, proteinPerUnit: 7, carbsPerUnit: 78, fatPerUnit: 0.6 },
    { id: "vegetables", name: "混合蔬菜", category: "蔬菜", nutritionUnit: "1 份", shoppingUnit: "按喜好采购", shoppingPackSize: 1, shoppingPackUnit: "份", caloriesPerUnit: 45, proteinPerUnit: 2, carbsPerUnit: 8, fatPerUnit: 0.3, notes: "叶菜、十字花科、根茎、菌菇轮换" },
    { id: "fruit", name: "水果", category: "水果", nutritionUnit: "1 份", shoppingUnit: "按喜好采购", shoppingPackSize: 1, shoppingPackUnit: "份", caloriesPerUnit: 80, proteinPerUnit: 1, carbsPerUnit: 20, fatPerUnit: 0.2, notes: "香蕉、苹果、橙子、猕猴桃等轮换" },
  ];
}

export function defaultHomeDiet(): StandardHomeDiet {
  return { chickenGrams: 325, eggs: 3, milkMl: 500, wheyScoops: 1, riceGrams: 200, vegetableServings: 3, fruitServings: 2, fishSubstitutionDays: 2 };
}

export function defaultWeeklyMealPlan(startDate = startOfWeek()): WeeklyMealPlan {
  const dayPlans = Array.from({ length: 7 }, (_, index) => {
    const schedule = DEFAULT_WEEKLY_SCHEDULE[index];
    const carbDay: CarbDay = schedule?.type === "boxing" || schedule?.type === "tennis" ? "high" : schedule?.type === "strength" || schedule?.type === "swimming" ? "medium" : "low";
    return { date: addDays(startDate, index), carbDay, homeMeals: 2, socialMeals: 0, templateId: carbDay === "low" ? MEAL_TEMPLATES.find(template => template.dayType === "rest")?.id : MEAL_TEMPLATES.find(template => template.dayType === "training")?.id, templateScale: 1 };
  });
  return { startDate, days: 7, dayPlans };
}

function amountNumber(amount: string) {
  const match = amount.match(/\d+(?:\.\d+)?/);
  return match ? Number(match[0]) : undefined;
}

export function foodBaseUnit(foodId: string) {
  if (["chicken-breast", "salmon", "rice"].includes(foodId)) return "g";
  if (foodId === "milk") return "ml";
  if (foodId === "egg") return "个";
  if (foodId === "whey") return "勺";
  return "份";
}

export function foodBaseUnitFromDefinition(food: FoodItem) {
  if (["chicken-breast", "salmon", "rice"].includes(food.id)) return "g";
  if (food.id === "milk") return "ml";
  if (food.id === "egg") return "个";
  if (food.id === "whey") return "勺";
  const definition = food.nutritionUnit.toLowerCase().replace(/\s+/g, "");
  if (/\d(?:g|grams?|克)(?:$|[^a-z])/.test(definition)) return "g";
  if (/\d(?:ml|millilit(?:er|re)s?|毫升)(?:$|[^a-z])/.test(definition)) return "ml";
  if (/\d(?:个|只|枚|pieces?)(?:$|[^a-z])/.test(definition)) return "个";
  if (/\d(?:勺|scoops?)(?:$|[^a-z])/.test(definition)) return "勺";
  return "份";
}

function proteinPerBaseUnit(food: FoodItem) {
  const unit = foodBaseUnitFromDefinition(food);
  return unit === "g" || unit === "ml" ? food.proteinPerUnit / 100 : food.proteinPerUnit;
}

function ingredientTotals(template: MealTemplate) {
  return [template.rice, template.meat, template.greenVeg, ...template.hardyVeg].reduce((totals, ingredient) => ({
    kcal: totals.kcal + ingredient.kcal,
    protein: totals.protein + ingredient.protein,
    carbs: totals.carbs + ingredient.carbs,
    fat: totals.fat + ingredient.fat,
  }), { kcal: 0, protein: 0, carbs: 0, fat: 0 });
}

export function recalculateMealTemplate(template: MealTemplate, previousTemplate: MealTemplate = template): MealTemplate {
  const previousVisible = ingredientTotals(previousTemplate);
  const seasoning = {
    kcal: previousTemplate.totalKcal - previousVisible.kcal,
    protein: previousTemplate.macros.protein - previousVisible.protein,
    carbs: previousTemplate.macros.carbs - previousVisible.carbs,
    fat: previousTemplate.macros.fat - previousVisible.fat,
  };
  const visible = ingredientTotals(template);
  const totalKcal = Math.round(visible.kcal + seasoning.kcal);
  return {
    ...template,
    totalKcal,
    dayTotalKcal: Math.round(previousTemplate.dayTotalKcal - previousTemplate.totalKcal + totalKcal),
    macros: {
      protein: Math.round(visible.protein + seasoning.protein),
      carbs: Math.round(visible.carbs + seasoning.carbs),
      fat: Math.round(visible.fat + seasoning.fat),
    },
  };
}

export interface GroceryGeneratorOptions {
  nutritionTargets?: { calories: number; protein: number; carbs: number; fat: number; fruit: number; vegetables: number };
  carbTargets?: Record<CarbDay, { carbs: number; calories: number }>;
  trainingSchedule?: WeeklyScheduleEntry[];
  substitutionRules?: { daysPerWeek: number; foodIds: string[] };
  riceCupGrams?: number;
}

export function generateGroceryList(foods: FoodItem[], homeDiet: StandardHomeDiet, plan: WeeklyMealPlan, templates: MealTemplate[], inventory: InventoryItem[] = [], options: GroceryGeneratorOptions = {}) {
  type Requirement = { key: string; foodId?: string; name: string; category: string; quantity: number; unit: string };
  const requirements = new Map<string, Requirement>();
  const byId = (id: string) => foods.find(food => food.id === id);
  const add = (foodId: string | undefined, name: string, category: string, quantity: number, unit: string) => {
    if (quantity <= 0) return;
    const key = foodId ?? `name:${name}`;
    const existing = requirements.get(key);
    requirements.set(key, existing ? { ...existing, quantity: existing.quantity + quantity } : { key, foodId, name, category, quantity, unit });
  };
  const effectiveHomeMeals = (day: WeeklyMealPlanDay) => Math.max(0, day.homeMeals - day.socialMeals);
  const homeDayFactor = plan.dayPlans.reduce((total, day) => total + effectiveHomeMeals(day) / 2, 0);
  const templateDays = plan.dayPlans.filter(day => effectiveHomeMeals(day) > 0 && day.templateId).map(day => ({ day, template: templates.find(template => template.id === day.templateId) })).filter((value): value is { day: WeeklyMealPlanDay; template: MealTemplate } => Boolean(value.template));
  const templateFactor = templateDays.reduce((total, value) => total + effectiveHomeMeals(value.day) / 2, 0);
  const standardFactor = Math.max(0, homeDayFactor - templateFactor);
  const resolveFood = (ingredient: IngredientDetail) => {
    const normalized = ingredient.name.toLowerCase();
    return foods.find(item => normalized.includes(item.name.toLowerCase()) || item.name.toLowerCase().includes(normalized)) ?? (normalized.includes("米") ? byId("rice") : normalized.includes("鸡") ? byId("chicken-breast") : normalized.includes("三文鱼") ? byId("salmon") : undefined);
  };
  const carbTargets = options.carbTargets;
  const mediumCarbs = carbTargets?.medium.carbs || options.nutritionTargets?.carbs || 260;
  const proteinFactor = options.nutritionTargets ? Math.max(0.75, Math.min(1.3, options.nutritionTargets.protein / 145)) : 1;
  const schedule = options.trainingSchedule ?? [];
  const dayCarb = (day: WeeklyMealPlanDay, index: number): CarbDay => day.carbDay ?? (schedule[index]?.type === "boxing" || schedule[index]?.type === "tennis" ? "high" : schedule[index]?.type === "strength" || schedule[index]?.type === "swimming" ? "medium" : "low");
  const carbFactor = (day: WeeklyMealPlanDay, index: number) => carbTargets ? Math.max(0.6, Math.min(1.5, carbTargets[dayCarb(day, index)].carbs / mediumCarbs)) : 1;
  const addTemplateIngredient = (ingredient: IngredientDetail, category: string, factor: number, index: number, templateScale = 1) => {
    const amount = amountNumber(ingredient.amount);
    if (!amount) return;
    const food = resolveFood(ingredient);
    const carbMultiplier = food?.id === "rice" || ingredient.name.includes("米") ? carbFactor(plan.dayPlans[index], index) : 1;
    const proteinMultiplier = food?.category === "蛋白质" || category === "蛋白质" ? proteinFactor : 1;
    add(food?.id, ingredient.name, food?.category ?? category, amount * factor * templateScale * carbMultiplier * proteinMultiplier, food ? foodBaseUnitFromDefinition(food) : "g");
  };
  const substitution = options.substitutionRules ?? { daysPerWeek: homeDiet.fishSubstitutionDays, foodIds: ["salmon"] };
  const substitutionFoods = substitution.foodIds.map(byId).filter((food): food is FoodItem => Boolean(food && food.category === "蛋白质" && food.id !== "chicken-breast" && proteinPerBaseUnit(food) > 0));
  if (!substitutionFoods.length) {
    const salmon = byId("salmon");
    if (salmon) substitutionFoods.push(salmon);
  }
  const nextSubstitutionFood = () => substitutionFoods[substitutionIndex++ % substitutionFoods.length];
  const addEquivalentProtein = (sourceFood: FoodItem | undefined, sourceAmount: number, targetFood: FoodItem, factor: number) => {
    const sourceProtein = sourceFood ? proteinPerBaseUnit(sourceFood) : 0;
    const targetProtein = proteinPerBaseUnit(targetFood);
    const sourceQuantity = sourceAmount * factor * proteinFactor;
    const quantity = sourceProtein > 0 && targetProtein > 0 ? sourceQuantity * sourceProtein / targetProtein : sourceQuantity;
    add(targetFood.id, targetFood.name, "蛋白质", quantity, foodBaseUnitFromDefinition(targetFood));
  };
  let remainingFishDays = Math.min(homeDayFactor, Math.max(0, substitution.daysPerWeek));
  let substitutionIndex = 0;
  templateDays.forEach(({ day, template }) => {
    const index = plan.dayPlans.indexOf(day);
    const factor = effectiveHomeMeals(day) / 2;
    const templateScale = day.templateScale ?? 1;
    addTemplateIngredient(template.rice, "碳水", factor, index, templateScale);
    template.hardyVeg.forEach(ingredient => addTemplateIngredient(ingredient, "蔬菜", factor, index, templateScale));
    const meatAmount = amountNumber(template.meat.amount);
    const meatFood = resolveFood(template.meat);
    const fishFactor = meatAmount && meatFood?.id === "chicken-breast" ? Math.min(factor, remainingFishDays) : 0;
    const fishFood = fishFactor > 0 && meatAmount ? nextSubstitutionFood() : undefined;
    const appliedFishFactor = fishFood ? fishFactor : 0;
    if (fishFood && meatAmount) addEquivalentProtein(meatFood, meatAmount * templateScale, fishFood, appliedFishFactor);
    addTemplateIngredient(template.meat, "蛋白质", factor - appliedFishFactor, index, templateScale);
    remainingFishDays = Math.max(0, remainingFishDays - appliedFishFactor);
    addTemplateIngredient(template.greenVeg, "蔬菜", factor, index, templateScale);
  });
  const templateDayDates = new Set(templateDays.map(({ day }) => day.date));
  let standardChickenFactor = 0;
  plan.dayPlans.forEach(day => {
    if (templateDayDates.has(day.date)) return;
    const factor = effectiveHomeMeals(day) / 2;
    if (factor <= 0) return;
    const substituteFactor = Math.min(factor, remainingFishDays);
    standardChickenFactor += factor - substituteFactor;
    if (substituteFactor > 0) {
      const fishFood = nextSubstitutionFood();
      if (fishFood) addEquivalentProtein(byId("chicken-breast"), homeDiet.chickenGrams, fishFood, substituteFactor);
      else standardChickenFactor += substituteFactor;
    }
    remainingFishDays = Math.max(0, remainingFishDays - substituteFactor);
  });
  add("chicken-breast", "鸡胸肉", "蛋白质", homeDiet.chickenGrams * standardChickenFactor * proteinFactor, "g");
  add("egg", "鸡蛋", "蛋白质", homeDiet.eggs * homeDayFactor * proteinFactor, "个");
  add("milk", "牛奶", "蛋白质", homeDiet.milkMl * homeDayFactor * proteinFactor, "ml");
  add("whey", "乳清蛋白", "蛋白质", homeDiet.wheyScoops * homeDayFactor * proteinFactor, "勺");
  const standardRiceQuantity = plan.dayPlans.reduce((sum, day, index) => {
    if (templateDayDates.has(day.date)) return sum;
    return sum + homeDiet.riceGrams * (effectiveHomeMeals(day) / 2) * carbFactor(day, index);
  }, 0);
  add("rice", "白米", "碳水", standardRiceQuantity, "g");
  add("vegetables", "混合蔬菜", "蔬菜", homeDiet.vegetableServings * standardFactor, "份");
  add("fruit", "水果", "水果", homeDiet.fruitServings * homeDayFactor, "份");
  return Array.from(requirements.values()).map(requirement => {
    const food = requirement.foodId ? byId(requirement.foodId) : undefined;
    const available = inventory.filter(item => item.foodId === requirement.foodId && item.unit === requirement.unit).reduce((total, item) => total + item.quantity, 0);
    const toBuy = Math.max(0, requirement.quantity - available);
    const packSize = food?.shoppingPackSize && food.shoppingPackSize > 0 ? food.shoppingPackSize : 1;
    const packs = Math.ceil(toBuy / packSize);
    return { id: uid("grocery"), foodId: requirement.foodId, category: requirement.category, name: requirement.name, required: Math.round(requirement.quantity * 10) / 10, unit: requirement.unit, purchase: toBuy > 0 ? `${packs} × ${food?.shoppingUnit ?? "按包装"}` : "库存充足", checked: false, available: Math.round(available * 10) / 10, toBuy: Math.round(toBuy * 10) / 10, notes: food?.notes };
  });
}

export function normalizeState(input: Partial<FitnessState>): FitnessState {
  const base = defaultState();
  const rawSettings = isRecord(input.settings) ? input.settings as Record<string, unknown> : {};
  const rawNutritionTargets = isRecord(rawSettings.nutritionTargets) ? rawSettings.nutritionTargets : {};
  const rawCarbTargets = isRecord(rawSettings.carbTargets) ? rawSettings.carbTargets : {};
  const rawBenchmarks = isRecord(rawSettings.performanceBenchmarks) ? rawSettings.performanceBenchmarks : {};
  const rawSubstitution = isRecord(rawSettings.proteinSubstitution) ? rawSettings.proteinSubstitution : {};
  const rawHomeDiet = isRecord(input.standardHomeDiet) ? input.standardHomeDiet as Record<string, unknown> : {};
  const numberOr = (value: unknown, fallback: number) => typeof value === "number" && Number.isFinite(value) ? value : fallback;
  const optionalNumberOr = (value: unknown, fallback: number | undefined) => typeof value === "number" && Number.isFinite(value) ? value : fallback;
  const phase = rawSettings.phase === "phase0" || rawSettings.phase === "phase1" || rawSettings.phase === "phase2" ? rawSettings.phase : base.settings.phase;
  const nutritionTargets = {
    calories: numberOr(rawNutritionTargets.calories, base.settings.nutritionTargets.calories),
    protein: numberOr(rawNutritionTargets.protein, base.settings.nutritionTargets.protein),
    carbs: numberOr(rawNutritionTargets.carbs, base.settings.nutritionTargets.carbs),
    fat: numberOr(rawNutritionTargets.fat, base.settings.nutritionTargets.fat),
    fruit: numberOr(rawNutritionTargets.fruit, base.settings.nutritionTargets.fruit),
    vegetables: numberOr(rawNutritionTargets.vegetables, base.settings.nutritionTargets.vegetables),
  };
  const carbTargets = (['low', 'medium', 'high'] as const).reduce((result, day) => {
    const rawTarget = isRecord(rawCarbTargets[day]) ? rawCarbTargets[day] : {};
    result[day] = {
      carbs: numberOr(rawTarget.carbs, base.settings.carbTargets[day].carbs),
      calories: numberOr(rawTarget.calories, base.settings.carbTargets[day].calories),
    };
    return result;
  }, {} as FitnessState["settings"]["carbTargets"]);
  const performanceBenchmarks = {
    squat: optionalNumberOr(rawBenchmarks.squat, base.settings.performanceBenchmarks.squat),
    bench: optionalNumberOr(rawBenchmarks.bench, base.settings.performanceBenchmarks.bench),
    pulling: optionalNumberOr(rawBenchmarks.pulling, base.settings.performanceBenchmarks.pulling),
    longestFreestyleM: optionalNumberOr(rawBenchmarks.longestFreestyleM, base.settings.performanceBenchmarks.longestFreestyleM),
  };
  const substitutionFoodIds = Array.isArray(rawSubstitution.foodIds) ? rawSubstitution.foodIds.filter((id): id is string => typeof id === "string") : base.settings.proteinSubstitution.foodIds;
  const legacyFishDays = numberOr(rawHomeDiet.fishSubstitutionDays, base.standardHomeDiet.fishSubstitutionDays);
  const substitutionDays = Math.max(0, Math.min(7, numberOr(rawSubstitution.daysPerWeek, legacyFishDays)));
  return {
    ...base,
    ...input,
    settings: {
      ...base.settings,
      ...(isRecord(input.settings) ? input.settings : {}),
      phase,
      phaseDurationWeeks: Math.max(1, Math.min(104, Math.round(numberOr(rawSettings.phaseDurationWeeks, base.settings.phaseDurationWeeks)))),
      nutritionTargets,
      carbTargets,
      performanceBenchmarks,
      proteinSubstitution: {
        daysPerWeek: substitutionDays,
        foodIds: substitutionFoodIds.length ? substitutionFoodIds : base.settings.proteinSubstitution.foodIds,
      },
    },
    mealTemplates: input.mealTemplates?.length ? input.mealTemplates : base.mealTemplates,
    foods: Array.isArray(input.foods) ? input.foods.map(food => ({ ...(base.foods.find(defaultFood => defaultFood.id === food.id) ?? {}), ...food })) : base.foods,
    carbDayOverrides: { ...base.carbDayOverrides, ...(input.carbDayOverrides ?? {}) },
    standardHomeDiet: { ...base.standardHomeDiet, ...(input.standardHomeDiet ?? {}), fishSubstitutionDays: substitutionDays },
    reviewNotes: { ...base.reviewNotes, ...(input.reviewNotes ?? {}) },
    weeklyMealPlan: input.weeklyMealPlan?.dayPlans?.length ? input.weeklyMealPlan : base.weeklyMealPlan,
    inventory: input.inventory ?? base.inventory,
    strengthPrograms: input.strengthPrograms?.length ? input.strengthPrograms : base.strengthPrograms,
    weeklySchedule: input.weeklySchedule?.length ? input.weeklySchedule : base.weeklySchedule,
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function isFiniteNumber(value: unknown) {
  return value === undefined || (typeof value === "number" && Number.isFinite(value));
}

function isDateKey(value: unknown) {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

/** Validate imported snapshots before they can replace the local source of truth. */
export function validateStateSnapshot(input: unknown): string[] {
  if (!isRecord(input)) return ["备份必须是 JSON 对象"];
  const errors: string[] = [];
  if (input.version !== undefined && input.version !== 1) errors.push("不支持的备份版本");
  if (!isRecord(input.settings)) errors.push("缺少 settings 配置");
  else {
    const settings = input.settings;
    if (settings.phase !== undefined && !["phase0", "phase1", "phase2"].includes(settings.phase as string)) errors.push("settings.phase 配置不正确");
    if (settings.phaseStarted !== undefined && !isDateKey(settings.phaseStarted)) errors.push("settings.phaseStarted 格式不正确");
    ["heightCm", "phaseDurationWeeks", "targetWeight", "targetBodyFat", "riceCupGrams"].forEach(key => { if (!isFiniteNumber(settings[key])) errors.push(`settings.${key} 必须是有限数字`); });
    const numericTargetKeys = ["calories", "protein", "carbs", "fat", "fruit", "vegetables"];
    const nutritionSettings = settings.nutritionTargets;
    if (nutritionSettings !== undefined && !isRecord(nutritionSettings)) errors.push("settings.nutritionTargets 必须是对象");
    else if (isRecord(nutritionSettings)) numericTargetKeys.forEach(key => { if (!isFiniteNumber(nutritionSettings[key])) errors.push(`settings.nutritionTargets.${key} 必须是有限数字`); });
    const carbSettings = settings.carbTargets;
    if (carbSettings !== undefined && !isRecord(carbSettings)) errors.push("settings.carbTargets 必须是对象");
    else if (isRecord(carbSettings)) ["low", "medium", "high"].forEach(day => {
      const target = carbSettings[day];
      if (target !== undefined && !isRecord(target)) errors.push(`settings.carbTargets.${day} 必须是对象`);
      else if (isRecord(target)) ["carbs", "calories"].forEach(key => { if (!isFiniteNumber(target[key])) errors.push(`settings.carbTargets.${day}.${key} 必须是有限数字`); });
    });
    const benchmarkSettings = settings.performanceBenchmarks;
    if (benchmarkSettings !== undefined && !isRecord(benchmarkSettings)) errors.push("settings.performanceBenchmarks 必须是对象");
    else if (isRecord(benchmarkSettings)) ["squat", "bench", "pulling", "longestFreestyleM"].forEach(key => { if (!isFiniteNumber(benchmarkSettings[key])) errors.push(`settings.performanceBenchmarks.${key} 必须是有限数字`); });
    const substitutionSettings = settings.proteinSubstitution;
    if (substitutionSettings !== undefined && !isRecord(substitutionSettings)) errors.push("settings.proteinSubstitution 必须是对象");
    else if (isRecord(substitutionSettings)) {
      if (!isFiniteNumber(substitutionSettings.daysPerWeek)) errors.push("settings.proteinSubstitution.daysPerWeek 必须是有限数字");
      if (substitutionSettings.foodIds !== undefined && (!Array.isArray(substitutionSettings.foodIds) || substitutionSettings.foodIds.some(id => typeof id !== "string"))) errors.push("settings.proteinSubstitution.foodIds 必须是字符串数组");
    }
  }
  const collections = ["activities", "body", "recovery", "nutrition", "grocery", "groceryHistory", "mealTemplates", "foods", "inventory", "strengthPrograms", "weeklySchedule"];
  collections.forEach(key => { if (input[key] !== undefined && !Array.isArray(input[key])) errors.push(`${key} 必须是数组`); });
  const checkEntries = (key: string, fields: string[]) => {
    const entries = input[key];
    if (!Array.isArray(entries)) return;
    entries.forEach((entry, index) => {
      if (!isRecord(entry)) { errors.push(`${key}[${index}] 必须是对象`); return; }
      if (typeof entry.date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(entry.date)) errors.push(`${key}[${index}].date 格式不正确`);
      fields.forEach(field => { if (!isFiniteNumber(entry[field])) errors.push(`${key}[${index}].${field} 必须是有限数字`); });
    });
  };
  checkEntries("body", ["weight", "waist", "bodyFat"]);
  checkEntries("recovery", ["sleepHours", "sleepConsistency", "hrv", "restingHr", "whoopRecovery", "whoopStrain", "vo2max", "fatigue", "soreness", "motivation", "hunger", "sleepQuality"]);
  checkEntries("activities", ["durationMin", "rpe", "distanceM", "freestyleM", "longestFreestyleM"]);
  checkEntries("nutrition", ["homeMeals", "calories", "protein", "carbs", "fat", "riceGrams", "riceCups", "fruitServings", "vegetableServings"]);
  return errors;
}

function load(): FitnessState {
  if (typeof window === "undefined") return defaultState();
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return defaultState();
    const parsed = JSON.parse(raw) as Partial<FitnessState>;
    return normalizeState(parsed);
  } catch { return defaultState(); }
}

export function useFitnessStore() {
  const store = useContext(FitnessStoreContext);
  if (!store) throw new Error("useFitnessStore must be used inside FitnessStoreProvider");
  return store;
}

type FitnessStore = ReturnType<typeof useFitnessStoreState>;
const FitnessStoreContext = createContext<FitnessStore | null>(null);

function useFitnessStoreState() {
  const [state, setState] = useState<FitnessState>(load);
  const [hydrated, setHydrated] = useState(false);
  const [fileBacked, setFileBacked] = useState(false);
  const stateRef = useRef(state);
  stateRef.current = state;

  // The filesystem API is the source of truth in local development. The
  // browser copy is retained as a fallback and migrates into the file once.
  useEffect(() => {
    let active = true;
    const browserCopy = typeof window === "undefined" ? null : window.localStorage.getItem(KEY);
    fetch("/api/local-state")
      .then(async response => {
        if (!response.ok) throw new Error("local state unavailable");
        return (await response.json()) as { state?: FitnessState | null };
      })
      .then(async payload => {
        if (!active) return;
        setFileBacked(true);
        const serverState = payload.state?.version === 1 ? normalizeState(payload.state) : null;
        const browserState = browserCopy ? (() => {
          try { const parsed = JSON.parse(browserCopy) as FitnessState; return parsed.version === 1 ? normalizeState(parsed) : null; } catch { return null; }
        })() : null;
        const currentState = stateRef.current;
        const serverTime = serverState?.updatedAt ? Date.parse(serverState.updatedAt) : 0;
        const browserTime = browserState?.updatedAt ? Date.parse(browserState.updatedAt) : 0;
        const currentTime = currentState.updatedAt ? Date.parse(currentState.updatedAt) : 0;

        if (serverState && serverTime >= Math.max(browserTime, currentTime)) {
          setState(serverState);
        } else if (browserState && browserTime >= currentTime) {
          setState(browserState);
          if (!serverState || browserTime > serverTime) {
            await fetch("/api/local-state", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(browserState) });
          }
        } else if (!serverState && !browserState) {
          setState(currentState);
        }
      })
      .catch(() => {
        if (!active || !browserCopy) return;
        try {
          const fallback = normalizeState(JSON.parse(browserCopy) as FitnessState);
          if (fallback.version === 1 && (!stateRef.current.updatedAt || !fallback.updatedAt || Date.parse(fallback.updatedAt) >= Date.parse(stateRef.current.updatedAt))) setState(fallback);
        } catch { /* Ignore an invalid browser fallback. */ }
      })
      .finally(() => { if (active) setHydrated(true); });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try { window.localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* Browser fallback may be unavailable. */ }
    // Queue writes so rapid field edits cannot finish out of order and leave
    // an older snapshot on disk.
    persistQueue = persistQueue.then(async () => {
      try {
        const response = await fetch("/api/local-state", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(state) });
        if (response.ok) setFileBacked(true);
      } catch { /* Static hosting uses localStorage fallback. */ }
    });
  }, [state, hydrated]);
  const update = useCallback((fn: (current: FitnessState) => FitnessState) => setState(current => ({ ...fn(current), updatedAt: new Date().toISOString() })), []);
  const add = useCallback(<K extends keyof FitnessState>(key: K, value: FitnessState[K] extends Array<infer I> ? I : never) => {
    update(current => ({ ...current, [key]: [...(current[key] as unknown as unknown[]), value] } as FitnessState));
  }, [update]);
  const remove = useCallback(<K extends keyof FitnessState>(key: K, id: string) => {
    update(current => ({ ...current, [key]: (current[key] as unknown as { id: string }[]).filter(item => item.id !== id) } as FitnessState));
  }, [update]);
  const exportData = useCallback(() => JSON.stringify({ ...state, exportedAt: new Date().toISOString() }, null, 2), [state]);
  const importData = useCallback((json: string) => {
    let parsed: unknown;
    try { parsed = JSON.parse(json); } catch { throw new Error("备份文件不是有效 JSON"); }
    const errors = validateStateSnapshot(parsed);
    if (errors.length) throw new Error(errors.slice(0, 3).join("；"));
    const raw = parsed as Partial<FitnessState>;
    const incoming = normalizeState({ ...raw, version: 1 as const });
    setState(current => ({ ...current, ...incoming, updatedAt: new Date().toISOString() }));
  }, []);
  return useMemo(() => ({ state, setState, update, add, remove, exportData, importData, hydrated, fileBacked }), [state, update, add, remove, exportData, importData, hydrated, fileBacked]);
}

export function FitnessStoreProvider({ children }: { children: ReactNode }) {
  const store = useFitnessStoreState();
  return <FitnessStoreContext.Provider value={store}>{children}</FitnessStoreContext.Provider>;
}

export function uid(prefix: string) { return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`; }
export function formatDate(date: Date | string = new Date()) {
  if (typeof date === "string") return date;
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}
export function startOfWeek(date = new Date()) {
  const d = new Date(date); const day = d.getDay(); d.setDate(d.getDate() - (day === 0 ? 6 : day - 1)); return formatDate(d);
}
export function addDays(dateKey: string, amount: number) {
  const [year, month, day] = dateKey.split("-").map(Number);
  const date = new Date(year, month - 1, day); date.setDate(date.getDate() + amount); return formatDate(date);
}
export function daysBetween(start: string, end = today()) { return Math.max(0, Math.round((new Date(end).getTime() - new Date(start).getTime()) / 86400000)); }
export function average(values: Array<number | undefined>) { const v = values.filter((n): n is number => typeof n === "number"); return v.length ? v.reduce((a, b) => a + b, 0) / v.length : undefined; }
export function rollingAverage<T extends { date: string }>(entries: T[], days: number, selector: (entry: T) => number | undefined, asOf = formatDate()) {
  const start = addDays(asOf, -days + 1);
  return average(entries.filter(entry => entry.date >= start && entry.date <= asOf).map(selector));
}
export function trendChange<T extends { date: string }>(entries: T[], days: number, selector: (entry: T) => number | undefined, asOf = formatDate()) {
  const sorted = entries.slice().sort((a, b) => b.date.localeCompare(a.date));
  const current = sorted.find(entry => entry.date <= asOf && selector(entry) !== undefined);
  const baselineDate = addDays(asOf, -days);
  const baseline = sorted.find(entry => entry.date <= baselineDate && selector(entry) !== undefined);
  const currentValue = current ? selector(current) : undefined;
  const baselineValue = baseline ? selector(baseline) : undefined;
  return currentValue !== undefined && baselineValue !== undefined ? currentValue - baselineValue : undefined;
}
export function movingAverage(entries: BodyEntry[], days: number, asOf = formatDate()) { return rollingAverage(entries, days, entry => entry.weight, asOf); }

export function rangeTrend<T extends { date: string }>(entries: T[], selector: (entry: T) => number | undefined) {
  const values = entries.slice().sort((a, b) => a.date.localeCompare(b.date)).map(selector).filter((value): value is number => typeof value === "number");
  return values.length >= 2 ? values[values.length - 1] - values[0] : undefined;
}

export function rangeRatePerWeek<T extends { date: string }>(entries: T[], selector: (entry: T) => number | undefined) {
  const sorted = entries.slice().sort((a, b) => a.date.localeCompare(b.date));
  const first = sorted.find(entry => selector(entry) !== undefined);
  const last = [...sorted].reverse().find(entry => selector(entry) !== undefined);
  if (!first || !last || first.date === last.date) return undefined;
  const delta = selector(last)! - selector(first)!;
  const weeks = Math.max(1, daysBetween(first.date, last.date) / 7);
  return delta / weeks;
}

export function entriesInRange<T extends { date: string }>(entries: T[], start: string, end: string) {
  return entries.filter(entry => entry.date >= start && entry.date <= end);
}

export interface ReviewSummary {
  period: { start: string; end: string; days: number };
  phase: { id: PhaseId; label: string; week: number; totalWeeks: number };
  body: {
    averageWeight?: number; weightTrend?: number; weightRatePerWeek?: number;
    averageWaist?: number; waistTrend?: number; bodyFatTrend?: number;
    averageBodyFat?: number;
  };
  training: {
    completed: number; planned: number; adherence: number; extraSessions: number; totalDurationMin: number;
    strengthSessions: number; swimmingSessions: number; swimmingDistanceM: number;
    freestyleM: number; longestFreestyleM?: number; tennisSessions: number; tennisHours: number;
    boxingSessions: number; strengthProgression: Array<{ exercise: string; firstWeight?: number; latestWeight?: number; delta?: number; firstReps?: number; latestReps?: number }>;
  };
  recovery: {
    averageSleep?: number; sleepTrend?: number; hrvTrend?: number; restingHrTrend?: number;
    whoopRecovery?: number; whoopStrain?: number; fatigue?: number; soreness?: number; motivation?: number; hunger?: number;
  };
  nutrition: {
    days: number; caloriesAverage?: number; proteinAdherence: number; carbsAverage?: number; fatAverage?: number;
    carbDayDistribution: Record<CarbDay, number>; fruitAdherence: number; vegetableAdherence: number; socialMeals: number; hungerTrend?: number;
  };
  calibration: { weightRatePerWeek?: number; waistChange?: number; intakeWeightRelationship: "insufficient-data" | "weight-down-intake-at-target" | "weight-up-intake-at-target" | "weight-down-intake-above-target" | "weight-down-intake-below-target" | "weight-up-intake-above-target" | "weight-up-intake-below-target" | "mixed" };
}

export function summarizeReview(state: FitnessState, start: string, end: string): ReviewSummary {
  const activities = entriesInRange(state.activities, start, end).filter(activity => activity.completed);
  const schedule = state.weeklySchedule.length ? state.weeklySchedule : DEFAULT_WEEKLY_SCHEDULE;
  const plannedDays = Array.from({ length: daysBetween(start, end) + 1 }, (_, index) => {
    const date = addDays(start, index);
    const week = startOfWeek(new Date(`${date}T12:00:00`));
    const dayIndex = daysBetween(week, date);
    const item = schedule.find(entry => entry.dayIndex === dayIndex) ?? schedule[dayIndex % schedule.length];
    return { date, week, item };
  }).filter(entry => entry.item.type !== "other" && entry.item.type !== "boxing");
  const plannedTaskKeys = new Set(plannedDays.map(entry => `${entry.week}:${entry.item.id}`));
  const completedPlannedKeys = new Set(activities.filter(activity => activity.weeklyTaskId && activity.planWeek && plannedTaskKeys.has(`${activity.planWeek}:${activity.weeklyTaskId}`)).map(activity => `${activity.planWeek}:${activity.weeklyTaskId}`));
  const planned = plannedTaskKeys.size;
  const completed = completedPlannedKeys.size;
  const extraSessions = activities.filter(activity => !activity.weeklyTaskId || !activity.planWeek || !plannedTaskKeys.has(`${activity.planWeek}:${activity.weeklyTaskId}`)).length;
  const body = entriesInRange(state.body, start, end);
  const recovery = entriesInRange(state.recovery, start, end);
  const nutrition = entriesInRange(state.nutrition, start, end);
  const strengthActivities = activities.filter(activity => activity.type === "strength");
  const progressionMap = new Map<string, ActivitySet[]>();
  strengthActivities.forEach(activity => (activity.sets ?? []).forEach(set => {
    const list = progressionMap.get(set.exercise) ?? [];
    list.push(set);
    progressionMap.set(set.exercise, list);
  }));
  const strengthProgression = Array.from(progressionMap.entries()).map(([exercise, sets]) => {
    const weighted = sets.filter(set => set.weight !== undefined || set.reps !== undefined);
    const first = weighted[0]; const latest = weighted[weighted.length - 1];
    return { exercise, firstWeight: first?.weight, latestWeight: latest?.weight, delta: first?.weight !== undefined && latest?.weight !== undefined ? latest.weight - first.weight : undefined, firstReps: first?.reps, latestReps: latest?.reps };
  });
  const targetProtein = state.settings.nutritionTargets.protein;
  const targetFruit = state.settings.nutritionTargets.fruit;
  const targetVegetables = state.settings.nutritionTargets.vegetables;
  const carbDayDistribution = nutrition.reduce((result, entry) => ({ ...result, [entry.carbDay]: result[entry.carbDay] + 1 }), { low: 0, medium: 0, high: 0 } as Record<CarbDay, number>);
  const averageWeight = average(body.map(entry => entry.weight));
  const averageWaist = average(body.map(entry => entry.waist));
  const avgCalories = average(nutrition.map(entry => entry.calories));
  const weightRate = rangeRatePerWeek(body, entry => entry.weight);
  const waistChange = rangeTrend(body, entry => entry.waist);
  const weightTrend = rangeTrend(body, entry => entry.weight);
  const targetCalories = state.settings.nutritionTargets.calories;
  const intakeAtTarget = targetCalories > 0 && avgCalories !== undefined && Math.abs(avgCalories - targetCalories) / targetCalories <= 0.1;
  const intakeAboveTarget = avgCalories !== undefined && targetCalories > 0 && avgCalories > targetCalories * 1.1;
  const intakeWeightRelationship: ReviewSummary["calibration"]["intakeWeightRelationship"] = avgCalories === undefined || weightRate === undefined ? "insufficient-data" : Math.abs(weightRate) <= 0.1 ? "mixed" : intakeAtTarget ? weightRate < 0 ? "weight-down-intake-at-target" : "weight-up-intake-at-target" : intakeAboveTarget ? weightRate < 0 ? "weight-down-intake-above-target" : "weight-up-intake-above-target" : weightRate < 0 ? "weight-down-intake-below-target" : "weight-up-intake-below-target";
  const phase = PHASES[state.settings.phase];
  const phaseWeeks = state.settings.phaseDurationWeeks || phase.weeks;
  return {
    period: { start, end, days: daysBetween(start, end) + 1 },
    phase: { id: state.settings.phase, label: phase.label, week: Math.min(phaseWeeks, Math.floor(daysBetween(state.settings.phaseStarted, end) / 7) + 1), totalWeeks: phaseWeeks },
    body: { averageWeight, weightTrend, weightRatePerWeek: weightRate, averageWaist, waistTrend: waistChange, averageBodyFat: average(body.map(entry => entry.bodyFat)), bodyFatTrend: rangeTrend(body, entry => entry.bodyFat) },
    training: { completed, planned, adherence: planned ? Math.min(100, Math.round(completed / planned * 100)) : 0, extraSessions, totalDurationMin: activities.reduce((sum, activity) => sum + activity.durationMin, 0), strengthSessions: strengthActivities.length, swimmingSessions: activities.filter(activity => activity.type === "swimming").length, swimmingDistanceM: activities.filter(activity => activity.type === "swimming").reduce((sum, activity) => sum + (activity.distanceM ?? 0), 0), freestyleM: activities.filter(activity => activity.type === "swimming").reduce((sum, activity) => sum + (activity.freestyleM ?? 0), 0), longestFreestyleM: Math.max(0, ...activities.map(activity => activity.longestFreestyleM ?? 0)) || undefined, tennisSessions: activities.filter(activity => activity.type === "tennis").length, tennisHours: activities.filter(activity => activity.type === "tennis").reduce((sum, activity) => sum + activity.durationMin, 0) / 60, boxingSessions: activities.filter(activity => activity.type === "boxing").length, strengthProgression },
    recovery: { averageSleep: average(recovery.map(entry => entry.sleepHours)), sleepTrend: rangeTrend(recovery, entry => entry.sleepHours), hrvTrend: rangeTrend(recovery, entry => entry.hrv), restingHrTrend: rangeTrend(recovery, entry => entry.restingHr), whoopRecovery: average(recovery.map(entry => entry.whoopRecovery)), whoopStrain: average(recovery.map(entry => entry.whoopStrain)), fatigue: average(recovery.map(entry => entry.fatigue)), soreness: average(recovery.map(entry => entry.soreness)), motivation: average(recovery.map(entry => entry.motivation)), hunger: average(recovery.map(entry => entry.hunger)) },
    nutrition: { days: nutrition.length, caloriesAverage: avgCalories, proteinAdherence: nutrition.length ? Math.round(nutrition.filter(entry => (entry.protein ?? 0) >= targetProtein).length / nutrition.length * 100) : 0, carbsAverage: average(nutrition.map(entry => entry.carbs)), fatAverage: average(nutrition.map(entry => entry.fat)), carbDayDistribution, fruitAdherence: nutrition.length ? Math.round(nutrition.filter(entry => (entry.fruitServings ?? 0) >= targetFruit).length / nutrition.length * 100) : 0, vegetableAdherence: nutrition.length ? Math.round(nutrition.filter(entry => (entry.vegetableServings ?? 0) >= targetVegetables).length / nutrition.length * 100) : 0, socialMeals: nutrition.filter(entry => Boolean(entry.socialMeal)).length, hungerTrend: rangeTrend(recovery, entry => entry.hunger) },
    calibration: { weightRatePerWeek: weightRate, waistChange, intakeWeightRelationship },
  };
}
export { KEY, WORKOUT_TEMPLATES };
