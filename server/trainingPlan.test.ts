import { describe, expect, it } from "vitest";
import { DEFAULT_WEEKLY_SCHEDULE, phaseWeekForDate } from "../shared/trainingPlan";
import { DEFAULT_STRENGTH_PROGRAMS, phase0RirForWeek } from "../shared/strengthPrograms";
import { rollingAverage, trendChange } from "../client/src/lib/localStore";

describe("P1 training plan data", () => {
  it("ships the seven-day default architecture", () => {
    expect(DEFAULT_WEEKLY_SCHEDULE).toHaveLength(7);
    expect(DEFAULT_WEEKLY_SCHEDULE.map(entry => entry.dayIndex)).toEqual([0, 1, 2, 3, 4, 5, 6]);
  });

  it("ships three editable strength programs and progressive Phase 0 guidance", () => {
    expect(DEFAULT_STRENGTH_PROGRAMS.map(program => program.id)).toEqual(["strength-a", "strength-b", "strength-c"]);
    expect(phase0RirForWeek(1)).toBe("3–4");
    expect(phase0RirForWeek(3)).toBe("2–3");
  });

  it("calculates the phase week from the planned session date", () => {
    expect(phaseWeekForDate("2026-08-03", "2026-08-03", 6)).toBe(1);
    expect(phaseWeekForDate("2026-08-03", "2026-08-24", 6)).toBe(4);
    expect(phaseWeekForDate("2026-08-03", "2026-10-01", 6)).toBe(6);
  });

  it("calculates calendar-window recovery trends without treating missing days as zero", () => {
    const entries = [
      { date: "2026-08-20", value: 60 },
      { date: "2026-08-22", value: 62 },
      { date: "2026-08-27", value: 64 },
      { date: "2026-08-29", value: 66 },
    ];
    expect(rollingAverage(entries, 7, entry => entry.value, "2026-08-29")).toBe(65);
    expect(trendChange(entries, 7, entry => entry.value, "2026-08-29")).toBe(4);
  });
});
