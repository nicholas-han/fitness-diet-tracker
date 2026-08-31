import { describe, expect, it } from "vitest";
import { addDays, formatDate, normalizeState, startOfWeek } from "./localStore";

describe("local calendar helpers", () => {
  it("formats dates using the user's local calendar", () => {
    const date = new Date(2026, 7, 31, 8, 15, 0);
    expect(formatDate(date)).toBe("2026-08-31");
  });

  it("calculates Monday-based weeks without UTC conversion", () => {
    expect(startOfWeek(new Date(2026, 7, 30, 8))).toBe("2026-08-24");
    expect(addDays("2026-08-24", 6)).toBe("2026-08-30");
  });

  it("upgrades P0 snapshots with the default editable strength programs", () => {
    const state = normalizeState({ version: 1, settings: { phase: "phase0" } } as any);
    expect(state.strengthPrograms.map(program => program.id)).toEqual(["strength-a", "strength-b", "strength-c"]);
  });
});
