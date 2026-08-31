import { mkdir, readFile, rename, rm, writeFile } from "node:fs/promises";
import path from "node:path";

export const CURRENT_DATA_VERSION = 1 as const;

export type LocalStateRecord = {
  version: typeof CURRENT_DATA_VERSION;
  updatedAt?: string;
  settings: Record<string, unknown>;
  activities: unknown[];
  body: unknown[];
  recovery: unknown[];
  nutrition: unknown[];
  grocery: unknown[];
  groceryHistory: unknown[];
  mealTemplates: unknown[];
  foods: unknown[];
  inventory: unknown[];
  [key: string]: unknown;
};

const defaultDataDir = path.resolve(import.meta.dirname, "..", "personal-data");
export const dataDir = process.env.FITNESS_DATA_DIR
  ? path.resolve(process.env.FITNESS_DATA_DIR)
  : defaultDataDir;
export const dataFile = path.join(dataDir, "fitness-os.json");

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** Accept the current format and upgrade the pre-file-storage browser shape. */
export function migrateLocalState(input: unknown): LocalStateRecord {
  if (!isRecord(input)) throw new Error("State must be a JSON object");
  const source = { ...input };
  const version = source.version;
  if (version !== undefined && version !== CURRENT_DATA_VERSION) {
    throw new Error(`Unsupported state version: ${String(version)}`);
  }
  if (!isRecord(source.settings)) throw new Error("State settings are required");

  // The first browser implementation had no version field. It has the same
  // shape, so adding version 1 is a lossless migration.
  const arrays = ["activities", "body", "recovery", "nutrition", "grocery", "groceryHistory", "mealTemplates", "foods", "inventory", "strengthPrograms", "weeklySchedule"] as const;
  for (const key of arrays) {
    if (source[key] !== undefined && !Array.isArray(source[key])) {
      throw new Error(`State field ${key} must be an array`);
    }
  }
  return {
    ...source,
    version: CURRENT_DATA_VERSION,
    settings: source.settings,
    activities: Array.isArray(source.activities) ? source.activities : [],
    body: Array.isArray(source.body) ? source.body : [],
    recovery: Array.isArray(source.recovery) ? source.recovery : [],
    nutrition: Array.isArray(source.nutrition) ? source.nutrition : [],
    grocery: Array.isArray(source.grocery) ? source.grocery : [],
    groceryHistory: Array.isArray(source.groceryHistory) ? source.groceryHistory : [],
    mealTemplates: Array.isArray(source.mealTemplates) ? source.mealTemplates : [],
    foods: Array.isArray(source.foods) ? source.foods : [],
    inventory: Array.isArray(source.inventory) ? source.inventory : [],
  };
}

export function createLocalDataStore(directory = dataDir) {
  const file = path.join(directory, "fitness-os.json");
  let writeQueue = Promise.resolve();

  const read = async (): Promise<LocalStateRecord | null> => {
    try {
      const parsed = JSON.parse(await readFile(file, "utf8")) as unknown;
      return migrateLocalState(parsed);
    } catch (error: any) {
      if (error?.code === "ENOENT") return null;
      throw error;
    }
  };

  const write = (input: unknown): Promise<void> => {
    const normalized = migrateLocalState(input);
    const operation = writeQueue.catch(() => undefined).then(async () => {
      const existing = await read();
      const existingTime = existing?.updatedAt ? Date.parse(existing.updatedAt) : 0;
      const incomingTime = normalized.updatedAt ? Date.parse(normalized.updatedAt) : 0;
      // A delayed request from another tab must not overwrite a newer state.
      if (existing && existingTime > 0 && (incomingTime === 0 || existingTime > incomingTime)) return;
      await mkdir(directory, { recursive: true });
      const temporaryFile = `${file}.${process.pid}.tmp`;
      await writeFile(temporaryFile, `${JSON.stringify(normalized, null, 2)}\n`, "utf8");
      await rename(temporaryFile, file);
    });
    // Keep the queue usable after this operation rejects, while returning the
    // rejection to this caller so the API can report the failed write.
    writeQueue = operation.catch(() => undefined);
    return operation;
  };

  return { file, read, write };
}

const store = createLocalDataStore();
export const readLocalState = store.read;
export const writeLocalState = store.write;
export async function removeLocalState() { await rm(dataFile, { force: true }); }
