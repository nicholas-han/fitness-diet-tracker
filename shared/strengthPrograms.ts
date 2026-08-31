export interface StrengthExercise {
  id: string;
  name: string;
  alternatives: string[];
  sets: number;
  repRange: string;
  targetRir: string;
  category: "compound" | "accessory" | "core";
}

export function phase0RirForWeek(weekNumber: number) {
  return weekNumber <= 2 ? "3–4" : "2–3";
}

export interface StrengthProgram {
  id: "strength-a" | "strength-b" | "strength-c";
  title: string;
  description: string;
  exercises: StrengthExercise[];
}

const phase0Rir = phase0RirForWeek(1);

export const DEFAULT_STRENGTH_PROGRAMS: StrengthProgram[] = [
  {
    id: "strength-a",
    title: "Strength A",
    description: "膝主导 + 水平推拉 + 躯干屈曲",
    exercises: [
      { id: "a-squat", name: "后蹲", alternatives: ["Hack Squat"], sets: 3, repRange: "5–8", targetRir: phase0Rir, category: "compound" },
      { id: "a-press", name: "卧推", alternatives: ["器械胸推"], sets: 3, repRange: "6–10", targetRir: phase0Rir, category: "compound" },
      { id: "a-pull", name: "高位下拉", alternatives: ["引体向上"], sets: 3, repRange: "6–10", targetRir: phase0Rir, category: "compound" },
      { id: "a-lateral", name: "侧平举", alternatives: [], sets: 3, repRange: "10–15", targetRir: phase0Rir, category: "accessory" },
      { id: "a-crunch", name: "绳索卷腹", alternatives: [], sets: 3, repRange: "8–15", targetRir: phase0Rir, category: "core" },
    ],
  },
  {
    id: "strength-b",
    title: "Strength B",
    description: "髋主导 + 上斜推拉 + 抗旋",
    exercises: [
      { id: "b-hinge", name: "罗马尼亚硬拉", alternatives: [], sets: 3, repRange: "6–10", targetRir: phase0Rir, category: "compound" },
      { id: "b-press", name: "上斜哑铃卧推", alternatives: [], sets: 3, repRange: "6–10", targetRir: phase0Rir, category: "compound" },
      { id: "b-row", name: "胸托划船", alternatives: [], sets: 3, repRange: "8–12", targetRir: phase0Rir, category: "compound" },
      { id: "b-split", name: "保加利亚分腿蹲", alternatives: [], sets: 3, repRange: "8–12 / 侧", targetRir: phase0Rir, category: "compound" },
      { id: "b-rear-delt", name: "反向飞鸟", alternatives: ["Face Pull"], sets: 3, repRange: "10–15", targetRir: phase0Rir, category: "accessory" },
      { id: "b-pallof", name: "Pallof Press", alternatives: [], sets: 3, repRange: "8–12 / 侧", targetRir: phase0Rir, category: "core" },
    ],
  },
  {
    id: "strength-c",
    title: "Strength C",
    description: "腿部容量 + 垂直拉 + 肩部与小腿",
    exercises: [
      { id: "c-leg", name: "腿举", alternatives: ["前蹲"], sets: 3, repRange: "8–12", targetRir: phase0Rir, category: "compound" },
      { id: "c-pull", name: "引体向上", alternatives: ["高位下拉"], sets: 3, repRange: "6–10", targetRir: phase0Rir, category: "compound" },
      { id: "c-press", name: "器械胸推", alternatives: ["哑铃胸推"], sets: 3, repRange: "8–12", targetRir: phase0Rir, category: "compound" },
      { id: "c-lateral", name: "侧平举", alternatives: [], sets: 3, repRange: "10–15", targetRir: phase0Rir, category: "accessory" },
      { id: "c-calf", name: "提踵", alternatives: [], sets: 3, repRange: "8–15", targetRir: phase0Rir, category: "accessory" },
      { id: "c-leg-raise", name: "悬垂举膝", alternatives: ["举腿"], sets: 3, repRange: "8–15", targetRir: phase0Rir, category: "core" },
    ],
  },
];

export type TrainingSessionKind = "swimming" | "tennis" | "boxing";

export const SPORT_SESSION_TYPES: Record<TrainingSessionKind, string[]> = {
  swimming: ["Easy aerobic", "Technique", "Interval", "Recovery"],
  tennis: ["Rally", "Coaching", "Serve Practice", "Match", "Mixed"],
  boxing: ["Coaching", "Bag", "Other"],
};

export type CoreFocus = "flexion" | "anti-extension" | "anti-rotation" | "rotation";

export const CORE_FOCUS_LABELS: Record<CoreFocus, string> = {
  flexion: "屈曲",
  "anti-extension": "抗伸展",
  "anti-rotation": "抗旋转",
  rotation: "旋转 / 旋转爆发",
};

export const CORE_MOVEMENTS: Record<CoreFocus, { name: string; targetReps: string }[]> = {
  flexion: [{ name: "绳索卷腹", targetReps: "8–15" }, { name: "悬垂举膝", targetReps: "8–15" }],
  "anti-extension": [{ name: "健腹轮", targetReps: "8–12" }, { name: "死虫式", targetReps: "10–12 / 侧" }],
  "anti-rotation": [{ name: "Pallof Press", targetReps: "8–12 / 侧" }, { name: "侧支撑", targetReps: "30–45 秒 / 侧" }],
  rotation: [{ name: "Cable Chop", targetReps: "8–12 / 侧" }, { name: "药球旋转", targetReps: "8–10 / 侧" }],
};
