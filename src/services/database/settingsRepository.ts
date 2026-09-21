import { getDatabase } from './db';

/** Reads a persisted setting, JSON-decoded, falling back to `defaultValue` if the
 * key doesn't exist yet or its stored value is malformed. */
export async function getSetting<T>(key: string, defaultValue: T): Promise<T> {
  const database = await getDatabase();
  const row = await database.getFirstAsync<{ value: string }>('SELECT value FROM settings WHERE key = ?', [key]);
  if (!row) return defaultValue;

  try {
    return JSON.parse(row.value) as T;
  } catch {
    return defaultValue;
  }
}

export async function setSetting<T>(key: string, value: T): Promise<void> {
  const database = await getDatabase();
  await database.runAsync(
    `INSERT INTO settings (key, value) VALUES (?, ?)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
    [key, JSON.stringify(value)],
  );
}
