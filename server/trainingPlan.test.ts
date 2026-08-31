import { describe, expect, it } from "vitest";
import { DEFAULT_WEEKLY_SCHEDULE, phaseWeekForDate } from "../shared/trainingPlan";
import { DEFAULT_STRENGTH_PROGRAMS, phase0RirForWeek } from "../shared/strengthPrograms";

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
});
