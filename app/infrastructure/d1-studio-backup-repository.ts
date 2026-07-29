import { env } from "cloudflare:workers";
import type {
  StudioBackupRepository,
  StudioExportSnapshot,
  StudioRestorePoint,
} from "../domain/studio";

const TABLES = [
  "site_settings", "navigation_items", "categories", "tags", "articles",
  "article_sections", "article_tags", "article_drafts", "article_revisions",
  "article_reactions", "projects", "algorithm_problems", "algorithm_problem_tags",
  "algorithm_solutions", "algorithm_code_blocks", "algorithm_references",
] as const;

type TableName = typeof TABLES[number];

function database(): D1Database {
  if (!env.DB) throw new Error("Cloudflare D1 binding `DB` is required for backup.");
  return env.DB;
}

function quoteIdentifier(value: string): string {
  if (!/^[a-z_][a-z0-9_]*$/.test(value)) {
    throw new Error("Backup contains an invalid identifier.");
  }
  return `"${value}"`;
}

async function columnsFor(d1: D1Database): Promise<Record<TableName, readonly string[]>> {
  const results = await d1.batch(
    TABLES.map((table) => d1.prepare(`PRAGMA table_info(${table})`)),
  );
  return Object.fromEntries(TABLES.map((table, index) => [
    table,
    (results[index].results ?? []).map((row) => String((row as { name: string }).name)),
  ])) as Record<TableName, readonly string[]>;
}

export class D1StudioBackupRepository implements StudioBackupRepository {
  async exportSnapshot(): Promise<StudioExportSnapshot> {
    const d1 = database();
    const results = await d1.batch(TABLES.map((table) =>
      d1.prepare(`SELECT * FROM ${table}`)
    ));
    const tables = Object.fromEntries(TABLES.map((table, index) => [
      table,
      (results[index].results ?? []).map((row) => {
        const exported = { ...(row as Record<string, unknown>) };
        delete exported.write_token;
        return exported;
      }),
    ]));
    return {
      schemaVersion: 1,
      exportedAt: new Date().toISOString(),
      tables,
    };
  }

  async saveRestorePoint(snapshot: StudioExportSnapshot): Promise<string> {
    const id = crypto.randomUUID();
    const d1 = database();
    await d1.batch([
      d1.prepare(`
        INSERT INTO studio_restore_points (id, payload, created_at)
        VALUES (?, ?, ?)
      `).bind(id, JSON.stringify(snapshot), new Date().toISOString()),
      d1.prepare(`
        DELETE FROM studio_restore_points
        WHERE id NOT IN (
          SELECT id FROM studio_restore_points ORDER BY created_at DESC LIMIT 10
        )
      `),
    ]);
    return id;
  }

  async listRestorePoints(): Promise<StudioRestorePoint[]> {
    const result = await database().prepare(`
      SELECT id, created_at AS createdAt
      FROM studio_restore_points
      ORDER BY created_at DESC
      LIMIT 10
    `).all<StudioRestorePoint>();
    return result.results ?? [];
  }

  async findRestorePoint(id: string): Promise<StudioExportSnapshot | null> {
    const row = await database().prepare(`
      SELECT payload FROM studio_restore_points WHERE id = ?
    `).bind(id).first<{ payload: string }>();
    if (!row) return null;
    return JSON.parse(row.payload) as StudioExportSnapshot;
  }

  async restoreSnapshot(snapshot: StudioExportSnapshot): Promise<void> {
    const d1 = database();
    const tableColumns = await columnsFor(d1);
    const statements: D1PreparedStatement[] = [];

    for (const table of [...TABLES].reverse()) {
      statements.push(d1.prepare(`DELETE FROM ${table}`));
    }
    for (const table of TABLES) {
      const allowed = new Set(tableColumns[table]);
      for (const sourceRow of snapshot.tables[table] ?? []) {
        const row = { ...sourceRow };
        if (allowed.has("write_token")) row.write_token = null;
        const columns = Object.keys(row).filter((column) => allowed.has(column));
        if (!columns.length || Object.keys(row).some((column) => !allowed.has(column))) {
          throw new Error(`Backup row for ${table} does not match the current schema.`);
        }
        const columnSql = columns.map(quoteIdentifier).join(", ");
        const placeholders = columns.map(() => "?").join(", ");
        statements.push(
          d1.prepare(`INSERT INTO ${table} (${columnSql}) VALUES (${placeholders})`)
            .bind(...columns.map((column) => row[column] as D1Binding)),
        );
      }
    }
    await d1.batch(statements);
  }
}
