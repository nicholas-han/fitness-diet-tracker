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
  };
  activities: ActivityEntry[];
  body: BodyEntry[];
  recovery: RecoveryEntry[];
  nutrition: NutritionEntry[];
  grocery: GroceryItem[];
  groceryHistory: Array<{ date: string; items: GroceryItem[] }>;
  mealTemplates: MealTemplate[];
  foods: FoodItem[];
  standardHomeDiet: StandardHomeDiet;
  weeklyMealPlan: WeeklyMealPlan;
  inventory: InventoryItem[];
  strengthPrograms: StrengthProgram[];
  weeklySchedule: WeeklyScheduleEntry[];
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
  },
  activities: [], body: [], recovery: [], nutrition: [], grocery: [], groceryHistory: [], mealTemplates: MEAL_TEMPLATES, foods: defaultFoods(), standardHomeDiet: defaultHomeDiet(), weeklyMealPlan: defaultWeeklyMealPlan(), inventory: [], strengthPrograms: DEFAULT_STRENGTH_PROGRAMS, weeklySchedule: DEFAULT_WEEKLY_SCHEDULE,
});

export function defaultFoods(): FoodItem[] {
  return [
    { id: "chicken-breast", name: "鸡胸肉", category: "蛋白质", nutritionUnit: "100 g 生重", shoppingUnit: "1 kg 包", shoppingPackSize: 1000, shoppingPackUnit: "g", caloriesPerUnit: 110, proteinPerUnit: 23, carbsPerUnit: 0, fatPerUnit: 1.5 },
    { id: "salmon", name: "三文鱼", category: "蛋白质", nutritionUnit: "100 g", shoppingUnit: "500 g 包", shoppingPackSize: 500, shoppingPackUnit: "g", caloriesPerUnit: 208, proteinPerUnit: 20, carbsPerUnit: 0, fatPerUnit: 13 },
    { id: "egg", name: "鸡蛋", category: "蛋白质", nutritionUnit: "1 个", shoppingUnit: "12 个装", shoppingPackSize: 12, shoppingPackUnit: "个", caloriesPerUnit: 78, proteinPerUnit: 6.3, carbsPerUnit: 0.6, fatPerUnit: 5.3 },
    { id: "milk", name: "牛奶", category: "蛋白质", nutritionUnit: "100 ml", shoppingUnit: "1 L 盒", shoppingPackSize: 1000, shoppingPackUnit: "ml", caloriesPerUnit: 61, proteinPerUnit: 3.2, carbsPerUnit: 4.8, fatPerUnit: 3.3 },
    { id: "whey", name: "乳清蛋白", category: "蛋白质", nutritionUnit: "1 勺", shoppingUnit: "1 袋", shoppingPackSize: 30, shoppingPackUnit: "勺", caloriesPerUnit: 120, proteinPerUnit: 24, carbsPerUnit: 3, fatPerUnit: 2 },
    { id: "rice", name: "白米", category: "碳水", nutritionUnit: "100 g 生重", shoppingUnit: "2 kg 袋", shoppingPackSize: 2000, shoppingPackUnit: "g", caloriesPerUnit: 350, proteinPerUnit: 7, carbsPerUnit: 78, fatPerUnit: 0.6 },
    { id: "vegetables", name: "混合蔬菜", category: "蔬菜", nutritionUnit: "1 份", shoppingUnit: "按喜好采购", shoppingPackSize: 1, shoppingPackUnit: "份", caloriesPerUnit: 45, proteinPerUnit: 2, carbsPerUnit: 8, fatPerUnit: 0.3 },
    { id: "fruit", name: "水果", category: "水果", nutritionUnit: "1 份", shoppingUnit: "按喜好采购", shoppingPackSize: 1, shoppingPackUnit: "份", caloriesPerUnit: 80, proteinPerUnit: 1, carbsPerUnit: 20, fatPerUnit: 0.2 },
  ];
}

export function defaultHomeDiet(): StandardHomeDiet {
  return { chickenGrams: 325, eggs: 3, milkMl: 500, wheyScoops: 1, riceGrams: 200, vegetableServings: 3, fruitServings: 2, fishSubstitutionDays: 2 };
}

export function defaultWeeklyMealPlan(startDate = startOfWeek()): WeeklyMealPlan {
  const dayPlans = Array.from({ length: 7 }, (_, index) => {
    const schedule = DEFAULT_WEEKLY_SCHEDULE[index];
    const carbDay: CarbDay = schedule?.type === "boxing" || schedule?.type === "tennis" ? "high" : schedule?.type === "strength" || schedule?.type === "swimming" ? "medium" : "low";
    return { date: addDays(startDate, index), carbDay, homeMeals: 2, socialMeals: 0, templateId: carbDay === "low" ? MEAL_TEMPLATES.find(template => template.dayType === "rest")?.id : MEAL_TEMPLATES.find(template => template.dayType === "training")?.id };
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

export function generateGroceryList(foods: FoodItem[], homeDiet: StandardHomeDiet, plan: WeeklyMealPlan, templates: MealTemplate[], inventory: InventoryItem[] = []) {
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
  const addTemplateIngredient = (ingredient: IngredientDetail, category: string, factor: number) => {
    const amount = amountNumber(ingredient.amount);
    if (!amount) return;
    const normalized = ingredient.name.toLowerCase();
    const food = foods.find(item => normalized.includes(item.name.toLowerCase()) || item.name.toLowerCase().includes(normalized)) ?? (normalized.includes("米") ? byId("rice") : normalized.includes("鸡") ? byId("chicken-breast") : normalized.includes("三文鱼") ? byId("salmon") : undefined);
    add(food?.id, ingredient.name, food?.category ?? category, amount * factor, food ? foodBaseUnit(food.id) : "g");
  };
  templateDays.forEach(({ day, template }) => {
    const factor = effectiveHomeMeals(day) / 2;
    addTemplateIngredient(template.rice, "碳水", factor);
    template.hardyVeg.forEach(ingredient => addTemplateIngredient(ingredient, "蔬菜", factor));
    addTemplateIngredient(template.meat, "蛋白质", factor);
    addTemplateIngredient(template.greenVeg, "蔬菜", factor);
  });
  const fishDays = Math.min(homeDayFactor, homeDiet.fishSubstitutionDays);
  add("chicken-breast", "鸡胸肉", "蛋白质", homeDiet.chickenGrams * Math.max(0, standardFactor - fishDays), "g");
  add("salmon", "三文鱼", "蛋白质", homeDiet.chickenGrams * Math.min(standardFactor, fishDays), "g");
  add("egg", "鸡蛋", "蛋白质", homeDiet.eggs * homeDayFactor, "个");
  add("milk", "牛奶", "蛋白质", homeDiet.milkMl * homeDayFactor, "ml");
  add("whey", "乳清蛋白", "蛋白质", homeDiet.wheyScoops * homeDayFactor, "勺");
  add("rice", "白米", "碳水", homeDiet.riceGrams * standardFactor, "g");
  add("vegetables", "混合蔬菜", "蔬菜", homeDiet.vegetableServings * standardFactor, "份");
  add("fruit", "水果", "水果", homeDiet.fruitServings * homeDayFactor, "份");
  return Array.from(requirements.values()).map(requirement => {
    const food = requirement.foodId ? byId(requirement.foodId) : undefined;
    const available = inventory.filter(item => item.foodId === requirement.foodId && item.unit === requirement.unit).reduce((total, item) => total + item.quantity, 0);
    const toBuy = Math.max(0, requirement.quantity - available);
    const packSize = food?.shoppingPackSize && food.shoppingPackSize > 0 ? food.shoppingPackSize : 1;
    const packs = Math.ceil(toBuy / packSize);
    return { id: uid("grocery"), foodId: requirement.foodId, category: requirement.category, name: requirement.name, required: Math.round(requirement.quantity * 10) / 10, unit: requirement.unit, purchase: toBuy > 0 ? `${packs} × ${food?.shoppingUnit ?? "按包装"}` : "库存充足", checked: false, available: Math.round(available * 10) / 10, toBuy: Math.round(toBuy * 10) / 10 };
  });
}

export function normalizeState(input: Partial<FitnessState>): FitnessState {
  const base = defaultState();
  return {
    ...base,
    ...input,
    settings: { ...base.settings, ...(input.settings ?? {}) },
    mealTemplates: input.mealTemplates?.length ? input.mealTemplates : base.mealTemplates,
    foods: input.foods?.length ? input.foods.map(food => ({ ...(base.foods.find(defaultFood => defaultFood.id === food.id) ?? {}), ...food })) : base.foods,
    standardHomeDiet: { ...base.standardHomeDiet, ...(input.standardHomeDiet ?? {}) },
    weeklyMealPlan: input.weeklyMealPlan?.dayPlans?.length ? input.weeklyMealPlan : base.weeklyMealPlan,
    inventory: input.inventory ?? base.inventory,
    strengthPrograms: input.strengthPrograms?.length ? input.strengthPrograms : base.strengthPrograms,
    weeklySchedule: input.weeklySchedule?.length ? input.weeklySchedule : base.weeklySchedule,
  };
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
    const raw = JSON.parse(json) as Partial<FitnessState>;
    if (!raw || typeof raw !== "object" || !raw.settings) throw new Error("不支持的备份文件");
    const incoming = { ...raw, version: 1 as const } as FitnessState;
    setState(current => ({ ...defaultState(), ...current, ...incoming, updatedAt: new Date().toISOString(), settings: { ...defaultState().settings, ...incoming.settings } }));
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
export { KEY, WORKOUT_TEMPLATES };
