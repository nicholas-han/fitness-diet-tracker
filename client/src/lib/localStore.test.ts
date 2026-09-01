import { describe, expect, it } from "vitest";
import { addDays, defaultState, formatDate, normalizeState, startOfWeek, summarizeReview, validateStateSnapshot } from "./localStore";

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

  it("rejects malformed backup collections and non-finite numeric values", () => {
    expect(validateStateSnapshot({ version: 1, settings: {}, body: {}, activities: [] })).toEqual([
      "body 必须是数组",
    ]);
    expect(validateStateSnapshot({ version: 1, settings: {}, body: [{ date: "2026-08-31", weight: NaN }] })).toContain("body[0].weight 必须是有限数字");
  });

  it("accepts a complete empty backup", () => {
    expect(validateStateSnapshot({ version: 1, settings: {}, activities: [], body: [], recovery: [], nutrition: [] })).toEqual([]);
  });

  it("uses the configured phase duration in review summaries", () => {
    const state = defaultState();
    state.settings.phaseDurationWeeks = 8;
    state.settings.phaseStarted = "2026-01-01";
    expect(summarizeReview(state, "2026-02-20", "2026-02-20").phase.totalWeeks).toBe(8);
  });
});
