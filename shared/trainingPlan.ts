export type TrainingActivityType = "strength" | "swimming" | "running" | "cycling" | "tennis" | "boxing" | "core" | "other";

export interface OptionalWeeklyTask {
  id: string;
  title: string;
  type: TrainingActivityType;
  sessionType?: string;
  coreFocus?: "flexion" | "anti-extension" | "anti-rotation" | "rotation";
  secondary: string;
}

export interface WeeklyScheduleEntry {
  id: string;
  dayIndex: number;
  day: string;
  title: string;
  type: TrainingActivityType;
  programId?: "strength-a" | "strength-b" | "strength-c";
  sessionType?: string;
  coreFocus?: "flexion" | "anti-extension" | "anti-rotation" | "rotation";
  secondary: string;
  optionalTasks?: OptionalWeeklyTask[];
}

export function phaseWeekForDate(phaseStarted: string, date: string, maxWeeks: number) {
  const elapsedDays = Math.floor(Math.max(0, Date.parse(date) - Date.parse(phaseStarted)) / 86400000);
  return Math.min(maxWeeks, Math.floor(elapsedDays / 7) + 1);
}

export const DEFAULT_WEEKLY_SCHEDULE: WeeklyScheduleEntry[] = [
  { id: "monday", dayIndex: 0, day: "周一", title: "Strength A", type: "strength", programId: "strength-a", secondary: "可选：轻松游", optionalTasks: [{ id: "monday-easy-swim", title: "轻松游 / 自由泳技术", type: "swimming", sessionType: "Easy aerobic", secondary: "可选，保持轻松或技术性" }] },
  { id: "tuesday", dayIndex: 1, day: "周二", title: "网球", type: "tennis", sessionType: "Rally", secondary: "Rally / Coaching" },
  { id: "wednesday", dayIndex: 2, day: "周三", title: "游泳", type: "swimming", sessionType: "Technique", secondary: "可选：核心", optionalTasks: [{ id: "wednesday-core", title: "核心训练", type: "core", sessionType: "anti-extension", coreFocus: "anti-extension", secondary: "可选，按类型轮换" }] },
  { id: "thursday", dayIndex: 3, day: "周四", title: "Strength B", type: "strength", programId: "strength-b", secondary: "可选：轻松游", optionalTasks: [{ id: "thursday-easy-swim", title: "轻松游", type: "swimming", sessionType: "Easy aerobic", secondary: "可选，保持轻松" }] },
  { id: "friday", dayIndex: 4, day: "周五", title: "网球", type: "tennis", sessionType: "Match", secondary: "Rally / Match" },
  { id: "saturday", dayIndex: 5, day: "周六", title: "Strength C", type: "strength", programId: "strength-c", secondary: "可选：拳击或游泳", optionalTasks: [{ id: "saturday-boxing", title: "拳击", type: "boxing", sessionType: "Other", secondary: "可选 conditioning，不计硬性达标" }, { id: "saturday-optional-swim", title: "轻松游", type: "swimming", sessionType: "Easy aerobic", secondary: "可选恢复或技术训练" }, { id: "saturday-optional-tennis", title: "额外网球", type: "tennis", sessionType: "Mixed", secondary: "可选第三次网球，按恢复情况决定" }] },
  { id: "sunday", dayIndex: 6, day: "周日", title: "恢复游 / 灵活性", type: "swimming", sessionType: "Recovery", secondary: "或完全休息" },
];

/** Adds newly introduced optional tasks to old persisted schedules without overwriting user edits. */
export function migrateWeeklySchedule(schedule: WeeklyScheduleEntry[]) {
  return schedule.map(entry => {
    const defaultEntry = DEFAULT_WEEKLY_SCHEDULE.find(candidate => candidate.id === entry.id || candidate.dayIndex === entry.dayIndex);
    if (!defaultEntry?.optionalTasks) return entry;
    if (entry.optionalTasks === undefined) return { ...entry, optionalTasks: defaultEntry.optionalTasks.map(task => ({ ...task })) };
    if (entry.optionalTasks.length === 0) return entry;
    const existingIds = new Set(entry.optionalTasks.map(task => task.id));
    const missingTasks = defaultEntry.optionalTasks.filter(task => !existingIds.has(task.id)).map(task => ({ ...task }));
    return missingTasks.length ? { ...entry, optionalTasks: [...entry.optionalTasks, ...missingTasks] } : entry;
  });
}
