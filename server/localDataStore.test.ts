import { afterEach, describe, expect, it } from "vitest";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { createLocalDataStore, migrateLocalState } from "./localDataStore";

const dirs: string[] = [];
const minimal = { version: 1, settings: { phase: "phase0" }, activities: [], body: [], recovery: [], nutrition: [], grocery: [], groceryHistory: [], mealTemplates: [] };

afterEach(async () => {
  await Promise.all(dirs.splice(0).map(directory => rm(directory, { recursive: true, force: true })));
});

async function makeStore() {
  const directory = await mkdtemp(path.join(os.tmpdir(), "fitness-os-store-"));
  dirs.push(directory);
  return createLocalDataStore(directory);
}

describe("local data store", () => {
  it("returns null before the first save and writes a JSON snapshot", async () => {
    const store = await makeStore();
    expect(await store.read()).toBeNull();
    await store.write(minimal);
    expect(await store.read()).toMatchObject(minimal);
  });

  it("migrates the unversioned browser snapshot without dropping fields", () => {
    const migrated = migrateLocalState({ settings: { phase: "phase0" }, body: [{ date: "2026-08-31" }] });
    expect(migrated.version).toBe(1);
    expect(migrated.body).toHaveLength(1);
    expect(migrated.activities).toEqual([]);
  });

  it("rejects unsupported versions and malformed collection fields", async () => {
    expect(() => migrateLocalState({ version: 2, settings: {} })).toThrow("Unsupported state version");
    expect(() => migrateLocalState({ version: 1, settings: {}, body: {} })).toThrow("body must be an array");
    const store = await makeStore();
    await expect(store.write({ version: 1, settings: {} })).resolves.toBeUndefined();
  });

  it("serializes concurrent writes and keeps the last snapshot", async () => {
    const store = await makeStore();
    await Promise.all([
      store.write({ ...minimal, settings: { phase: "phase0" } }),
      store.write({ ...minimal, settings: { phase: "phase1" } }),
      store.write({ ...minimal, settings: { phase: "phase2" } }),
    ]);
    expect((await store.read())?.settings.phase).toBe("phase2");
  });

  it("recovers the queue after a filesystem failure", async () => {
    const directory = await mkdtemp(path.join(os.tmpdir(), "fitness-os-store-"));
    dirs.push(directory);
    const blockedPath = path.join(directory, "blocked");
    await writeFile(blockedPath, "not a directory", "utf8");
    const store = createLocalDataStore(blockedPath);
    await expect(store.write(minimal)).rejects.toBeTruthy();
    await rm(blockedPath, { force: true });
    await store.write(minimal);
    expect(await store.read()).toMatchObject(minimal);
  });

  it("does not let an older timestamp overwrite a newer snapshot", async () => {
    const store = await makeStore();
    await store.write({ ...minimal, updatedAt: "2026-08-31T10:00:00.000Z", settings: { phase: "phase2" } });
    await store.write({ ...minimal, updatedAt: "2026-08-31T09:00:00.000Z", settings: { phase: "phase0" } });
    expect((await store.read())?.settings.phase).toBe("phase2");
  });
});
