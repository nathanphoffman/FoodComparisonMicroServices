import { readFileSync } from 'fs';
import { resolve } from 'path';
import initSqlJs from 'sql.js';

type SqlDatabase = Awaited<ReturnType<typeof initSqlJs>>['Database']['prototype'];

let db: SqlDatabase | null = null;
let normalizedDb: SqlDatabase | null = null;

// DATA_DIR is set by next.config.ts to point at FoodComparisonNext/lib/data
const dataDir = process.env.DATA_DIR!;

async function initSql(): Promise<Awaited<ReturnType<typeof initSqlJs>>> {
  return initSqlJs({
    locateFile: (file: string) => require.resolve(`sql.js/dist/${file}`),
  });
}

export async function getDb(): Promise<SqlDatabase> {
  if (db) return db;
  const SQL = await initSql();
  const dbPath = resolve(dataDir, `foods.${process.env.DB_VERSION}.db`);
  db = new SQL.Database(readFileSync(dbPath));
  return db;
}

export async function getNormalizedDb(): Promise<SqlDatabase> {
  if (normalizedDb) return normalizedDb;
  const SQL = await initSql();
  const dbPath = resolve(dataDir, `foods-normalized.${process.env.DB_VERSION}.db`);
  normalizedDb = new SQL.Database(readFileSync(dbPath));
  return normalizedDb;
}

export function rowsToObjects(
  result: ReturnType<SqlDatabase['exec']>
): Record<string, unknown>[] {
  if (!result.length) return [];
  const { columns, values } = result[0];
  return values.map((row) =>
    Object.fromEntries(columns.map((col, i) => [col, row[i]]))
  );
}
