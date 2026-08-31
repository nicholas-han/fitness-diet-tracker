import { useCallback, useEffect, useMemo, useState } from "react";
import { MEAL_TEMPLATES } from "@shared/mealTemplates";
import { WORKOUT_TEMPLATES } from "@shared/workoutTemplates";

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
  type: "strength" | "swimming" | "tennis" | "boxing" | "other";
  title: string;
  durationMin: number;
  rpe?: number;
  distanceM?: number;
  freestyleM?: number;
  longestFreestyleM?: number;
  sessionType?: string;
  completed: boolean;
  notes?: string;
  sets?: Array<{ exercise: string; weight?: number; reps?: number; rir?: number }>;
}

export interface NutritionEntry {
  id: string;
  date: string;
  templateId?: string;
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
  category: string;
  name: string;
  required: number;
  unit: string;
  purchase: string;
  checked: boolean;
  notes?: string;
}

export interface FitnessState {
  version: 1;
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
  mealTemplates: typeof MEAL_TEMPLATES;
}

const KEY = "personal-fitness-os:v1";
const today = () => new Date().toISOString().slice(0, 10);
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
  activities: [], body: [], recovery: [], nutrition: [], grocery: [], groceryHistory: [], mealTemplates: MEAL_TEMPLATES,
});

function load(): FitnessState {
  if (typeof window === "undefined") return defaultState();
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return defaultState();
    const parsed = JSON.parse(raw) as Partial<FitnessState>;
    return { ...defaultState(), ...parsed, settings: { ...defaultState().settings, ...(parsed.settings ?? {}) } };
  } catch { return defaultState(); }
}

export function useFitnessStore() {
  const [state, setState] = useState<FitnessState>(load);
  const [hydrated, setHydrated] = useState(false);
  const [fileBacked, setFileBacked] = useState(false);

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
        if (payload.state?.version === 1) {
          setState(payload.state);
        } else if (browserCopy) {
          const migrated = JSON.parse(browserCopy) as FitnessState;
          if (migrated.version === 1) {
            setState(migrated);
            await fetch("/api/local-state", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(migrated) });
          }
        }
      })
      .catch(() => {
        if (!active || !browserCopy) return;
        try {
          const fallback = JSON.parse(browserCopy) as FitnessState;
          if (fallback.version === 1) setState(fallback);
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
  const update = useCallback((fn: (current: FitnessState) => FitnessState) => setState(current => fn(current)), []);
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
    setState(current => ({ ...defaultState(), ...current, ...incoming, settings: { ...defaultState().settings, ...incoming.settings } }));
  }, []);
  return useMemo(() => ({ state, setState, update, add, remove, exportData, importData, hydrated, fileBacked }), [state, update, add, remove, exportData, importData, hydrated, fileBacked]);
}

export function uid(prefix: string) { return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`; }
export function formatDate(date = today()) { return date; }
export function startOfWeek(date = new Date()) {
  const d = new Date(date); const day = d.getDay(); d.setDate(d.getDate() - (day === 0 ? 6 : day - 1)); return d.toISOString().slice(0, 10);
}
export function daysBetween(start: string, end = today()) { return Math.max(0, Math.round((new Date(end).getTime() - new Date(start).getTime()) / 86400000)); }
export function average(values: Array<number | undefined>) { const v = values.filter((n): n is number => typeof n === "number"); return v.length ? v.reduce((a, b) => a + b, 0) / v.length : undefined; }
export function movingAverage(entries: BodyEntry[], days: number) { const cutoff = new Date(); cutoff.setDate(cutoff.getDate() - days + 1); return average(entries.filter(e => new Date(e.date) >= cutoff).map(e => e.weight)); }
export { KEY, WORKOUT_TEMPLATES };
