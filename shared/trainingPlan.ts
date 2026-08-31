export type TrainingActivityType = "strength" | "swimming" | "running" | "cycling" | "tennis" | "boxing" | "core" | "other";

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
}

export const DEFAULT_WEEKLY_SCHEDULE: WeeklyScheduleEntry[] = [
  { id: "monday", dayIndex: 0, day: "周一", title: "Strength A", type: "strength", programId: "strength-a", secondary: "可选：轻松游" },
  { id: "tuesday", dayIndex: 1, day: "周二", title: "网球", type: "tennis", sessionType: "Rally", secondary: "Rally / Coaching" },
  { id: "wednesday", dayIndex: 2, day: "周三", title: "游泳", type: "swimming", sessionType: "Technique", secondary: "可选：核心" },
  { id: "thursday", dayIndex: 3, day: "周四", title: "Strength B", type: "strength", programId: "strength-b", secondary: "可选：轻松游" },
  { id: "friday", dayIndex: 4, day: "周五", title: "网球", type: "tennis", sessionType: "Match", secondary: "Rally / Match" },
  { id: "saturday", dayIndex: 5, day: "周六", title: "Strength C", type: "strength", programId: "strength-c", secondary: "可选：拳击" },
  { id: "sunday", dayIndex: 6, day: "周日", title: "恢复游 / 灵活性", type: "swimming", sessionType: "Recovery", secondary: "或完全休息" },
];
