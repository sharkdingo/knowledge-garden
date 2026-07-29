import type {
  StudioBackupRepository,
  StudioExportSnapshot,
  StudioRestorePreview,
} from "../domain/studio";
import { StudioValidationError } from "./studio-validation";

const REQUIRED_TABLES = [
  "site_settings", "navigation_items", "categories", "tags", "articles",
  "article_sections", "article_tags", "article_drafts", "article_revisions",
  "article_reactions", "projects", "algorithm_problems", "algorithm_problem_tags",
  "algorithm_solutions", "algorithm_code_blocks", "algorithm_references",
] as const;
const MAX_RESTORE_ROWS = 2_000;

function validateSnapshot(value: unknown): StudioExportSnapshot {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new StudioValidationError("备份文件结构无效。");
  }
  const snapshot = value as Partial<StudioExportSnapshot>;
  if (snapshot.schemaVersion !== 1 || typeof snapshot.exportedAt !== "string") {
    throw new StudioValidationError("备份版本或导出时间无效。");
  }
  if (!snapshot.tables || typeof snapshot.tables !== "object" || Array.isArray(snapshot.tables)) {
    throw new StudioValidationError("备份缺少数据表。");
  }
  let totalRows = 0;
  for (const table of REQUIRED_TABLES) {
    const rows = snapshot.tables[table];
    if (!Array.isArray(rows)) {
      throw new StudioValidationError(`备份缺少 ${table} 数据。`);
    }
    for (const row of rows) {
      if (!row || typeof row !== "object" || Array.isArray(row)) {
        throw new StudioValidationError(`${table} 中存在无效记录。`);
      }
    }
    totalRows += rows.length;
  }
  if (totalRows > MAX_RESTORE_ROWS) {
    throw new StudioValidationError(`一次最多恢复 ${MAX_RESTORE_ROWS} 条记录。`);
  }
  return {
    schemaVersion: 1,
    exportedAt: snapshot.exportedAt,
    tables: Object.fromEntries(REQUIRED_TABLES.map((table) => [table, snapshot.tables![table]])),
  };
}

async function checksum(snapshot: StudioExportSnapshot): Promise<string> {
  const bytes = new TextEncoder().encode(JSON.stringify(snapshot));
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)]
    .map((value) => value.toString(16).padStart(2, "0"))
    .join("");
}

export class StudioBackupService {
  constructor(private readonly repository: StudioBackupRepository) {}

  export() {
    return this.repository.exportSnapshot();
  }

  restorePoints() {
    return this.repository.listRestorePoints();
  }

  async preview(value: unknown): Promise<StudioRestorePreview> {
    const snapshot = validateSnapshot(value);
    const hash = await checksum(snapshot);
    const counts = Object.fromEntries(
      REQUIRED_TABLES.map((table) => [table, snapshot.tables[table].length]),
    );
    const totalRows = Object.values(counts).reduce((sum, count) => sum + count, 0);
    const warnings = [];
    if (!counts.site_settings) warnings.push("备份中没有站点设置，将恢复为空配置。");
    if (!counts.articles && !counts.algorithm_problems && !counts.projects) {
      warnings.push("备份中没有文章、题解或项目。");
    }
    return {
      checksum: hash,
      confirmationCode: `RESTORE-${hash.slice(0, 8).toUpperCase()}`,
      exportedAt: snapshot.exportedAt,
      totalRows,
      counts,
      warnings,
    };
  }

  async restore(value: unknown, confirmationCode: unknown): Promise<StudioRestorePreview> {
    const snapshot = validateSnapshot(value);
    const preview = await this.preview(snapshot);
    if (confirmationCode !== preview.confirmationCode) {
      throw new StudioValidationError("确认代码不匹配，请重新预演恢复。");
    }
    const current = await this.repository.exportSnapshot();
    await this.repository.saveRestorePoint(current);
    await this.repository.restoreSnapshot(snapshot);
    return preview;
  }

  async restorePoint(id: unknown): Promise<StudioRestorePreview> {
    if (typeof id !== "string" || !/^[0-9a-f-]{36}$/i.test(id)) {
      throw new StudioValidationError("恢复点编号无效。");
    }
    const snapshot = await this.repository.findRestorePoint(id);
    if (!snapshot) throw new StudioValidationError("找不到这个恢复点。");
    const current = await this.repository.exportSnapshot();
    const preview = await this.preview(snapshot);
    await this.repository.saveRestorePoint(current);
    await this.repository.restoreSnapshot(snapshot);
    return preview;
  }
}
