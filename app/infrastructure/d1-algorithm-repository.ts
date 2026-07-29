import { env } from "cloudflare:workers";
import type {
  AlgorithmCodeBlock,
  AlgorithmProblemDocument,
  AlgorithmProblemRepository,
  AlgorithmProblemSummary,
  AlgorithmReference,
  AlgorithmSolution,
} from "../domain/content";
import type {
  StudioAlgorithmProblem,
  StudioAlgorithmProblemInput,
  StudioAlgorithmProblemRepository,
  StudioAlgorithmProblemSummary,
} from "../domain/studio";

type ProblemRow = {
  slug: string;
  platform: string;
  problem_id: string;
  title: string;
  difficulty: AlgorithmProblemSummary["difficulty"];
  source_url: string;
  summary: string;
  statement: string;
  constraints: string;
  status: StudioAlgorithmProblemSummary["status"];
  solved_at: string;
  updated_at: string;
  featured: number;
  solution_count?: number;
  languages?: string | null;
  row_version: number;
};

type SolutionRow = {
  id: string;
  problem_slug: string;
  title: string;
  intuition: string;
  steps: string;
  proof: string;
  time_complexity: string;
  space_complexity: string;
  pitfalls: string;
};

type CodeRow = {
  id: string;
  solution_id: string;
  language: string;
  label: string;
  code: string;
};

type TagRow = {
  problem_slug: string;
  name: string;
};

type ReferenceRow = {
  id: string;
  problem_slug: string;
  solution_id: string | null;
  title: string;
  author: string;
  url: string;
  note: string;
  accessed_at: string;
};

function database(): D1Database {
  if (!env.DB) throw new Error("Cloudflare D1 binding `DB` is required for algorithm notes.");
  return env.DB;
}

function parseJson<T>(value: string, context: string): T {
  try {
    return JSON.parse(value) as T;
  } catch {
    throw new Error(`Invalid JSON in ${context}.`);
  }
}

function stringList(value: string | null | undefined): string[] {
  return value
    ? [...new Set(value.split(",").filter(Boolean))].sort((left, right) =>
        left.localeCompare(right, "zh-CN")
      )
    : [];
}

function storageId(problemSlug: string, localId: string): string {
  return `${problemSlug}--${localId}`;
}

function localId(problemSlug: string, persistedId: string): string {
  const prefix = `${problemSlug}--`;
  return persistedId.startsWith(prefix) ? persistedId.slice(prefix.length) : persistedId;
}

function mapSolution(
  problemSlug: string,
  row: SolutionRow,
  codes: readonly CodeRow[],
): AlgorithmSolution {
  return {
    id: localId(problemSlug, row.id),
    title: row.title,
    intuition: row.intuition,
    steps: parseJson<string[]>(row.steps, `algorithm solution ${row.id} steps`),
    proof: row.proof,
    timeComplexity: row.time_complexity,
    spaceComplexity: row.space_complexity,
    pitfalls: parseJson<string[]>(row.pitfalls, `algorithm solution ${row.id} pitfalls`),
    codeBlocks: codes
      .filter((code) => code.solution_id === row.id)
      .map((code): AlgorithmCodeBlock => ({
        id: localId(problemSlug, code.id),
        language: code.language,
        label: code.label,
        code: code.code,
      })),
  };
}

function mapSummary(row: ProblemRow, tags: readonly TagRow[]): AlgorithmProblemSummary {
  return {
    slug: row.slug,
    platform: row.platform,
    problemId: row.problem_id,
    title: row.title,
    difficulty: row.difficulty,
    sourceUrl: row.source_url,
    summary: row.summary,
    solvedAt: row.solved_at,
    updatedAt: row.updated_at,
    featured: Boolean(row.featured),
    tags: tags.filter((tag) => tag.problem_slug === row.slug).map((tag) => tag.name),
    solutionCount: Number(row.solution_count ?? 0),
    languages: stringList(row.languages),
  };
}

function mapReference(problemSlug: string, row: ReferenceRow): AlgorithmReference {
  return {
    id: localId(problemSlug, row.id),
    solutionId: row.solution_id ? localId(problemSlug, row.solution_id) : undefined,
    title: row.title,
    author: row.author,
    url: row.url,
    note: row.note,
    accessedAt: row.accessed_at,
  };
}

export class D1AlgorithmRepository
  implements AlgorithmProblemRepository, StudioAlgorithmProblemRepository
{
  async listAlgorithmProblems(): Promise<AlgorithmProblemSummary[]> {
    const d1 = database();
    const [problemResult, tagResult] = await d1.batch([
      d1.prepare(`
        SELECT
          p.*,
          COUNT(DISTINCT s.id) AS solution_count,
          GROUP_CONCAT(DISTINCT CASE
            WHEN cb.label <> '' THEN cb.label
            ELSE cb.language
          END) AS languages
        FROM algorithm_problems p
        LEFT JOIN algorithm_solutions s ON s.problem_slug = p.slug
        LEFT JOIN algorithm_code_blocks cb ON cb.solution_id = s.id
        WHERE p.status = 'published'
        GROUP BY p.slug
        ORDER BY p.featured DESC, p.solved_at DESC, p.problem_id
      `),
      d1.prepare(`
        SELECT apt.problem_slug, t.name
        FROM algorithm_problem_tags apt
        INNER JOIN tags t ON t.id = apt.tag_id
        INNER JOIN algorithm_problems p ON p.slug = apt.problem_slug
        WHERE p.status = 'published'
        ORDER BY t.name
      `),
    ]);
    const tags = (tagResult.results ?? []) as TagRow[];
    return ((problemResult.results ?? []) as ProblemRow[]).map((row) => mapSummary(row, tags));
  }

  async findAlgorithmProblemBySlug(slug: string): Promise<AlgorithmProblemDocument | null> {
    const result = await this.readProblem(slug, true);
    if (!result) return null;
    return {
      ...mapSummary(result.problem, result.tags),
      statement: result.problem.statement,
      constraints: parseJson<string[]>(
        result.problem.constraints,
        `algorithm problem ${slug} constraints`,
      ),
      solutions: result.solutions.map((solution) =>
        mapSolution(result.problem.slug, solution, result.codes)
      ),
      references: result.references.map((reference) =>
        mapReference(result.problem.slug, reference)
      ),
    };
  }

  async listStudioAlgorithmProblems(): Promise<StudioAlgorithmProblemSummary[]> {
    const result = await database().prepare(`
      SELECT
        p.slug, p.platform, p.problem_id, p.title, p.difficulty, p.status,
        p.solved_at, p.updated_at, p.row_version, COUNT(s.id) AS solution_count
      FROM algorithm_problems p
      LEFT JOIN algorithm_solutions s ON s.problem_slug = p.slug
      GROUP BY p.slug
      ORDER BY
        CASE p.status WHEN 'draft' THEN 0 WHEN 'published' THEN 1 ELSE 2 END,
        p.updated_at DESC
    `).all<ProblemRow>();
    return (result.results ?? []).map((row) => ({
      slug: row.slug,
      platform: row.platform,
      problemId: row.problem_id,
      title: row.title,
      difficulty: row.difficulty,
      status: row.status,
      solvedAt: row.solved_at,
      updatedAt: row.updated_at,
      solutionCount: Number(row.solution_count ?? 0),
      version: Number(row.row_version),
    }));
  }

  async findStudioAlgorithmProblem(slug: string): Promise<StudioAlgorithmProblem | null> {
    const result = await this.readProblem(slug, false);
    if (!result) return null;
    return {
      slug: result.problem.slug,
      platform: result.problem.platform,
      problemId: result.problem.problem_id,
      title: result.problem.title,
      difficulty: result.problem.difficulty,
      status: result.problem.status,
      solvedAt: result.problem.solved_at,
      updatedAt: result.problem.updated_at,
      solutionCount: result.solutions.length,
      version: Number(result.problem.row_version),
      sourceUrl: result.problem.source_url,
      summary: result.problem.summary,
      statement: result.problem.statement,
      constraints: parseJson<string[]>(
        result.problem.constraints,
        `algorithm problem ${slug} constraints`,
      ),
      featured: Boolean(result.problem.featured),
      tags: result.tags.map((tag) => tag.name),
      solutions: result.solutions.map((solution) =>
        mapSolution(result.problem.slug, solution, result.codes)
      ),
      references: result.references.map((reference) =>
        mapReference(result.problem.slug, reference)
      ),
    };
  }

  async createStudioAlgorithmProblem(input: StudioAlgorithmProblemInput): Promise<void> {
    const d1 = database();
    const relations = this.prepareRelations(d1, input);
    const now = new Date().toISOString();
    await d1.batch([
      d1.prepare(`
        INSERT INTO algorithm_problems (
          slug, platform, problem_id, title, difficulty, source_url, summary,
          statement, constraints, status, solved_at, updated_at, featured
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        input.slug,
        input.platform,
        input.problemId,
        input.title,
        input.difficulty,
        input.sourceUrl,
        input.summary,
        input.statement,
        JSON.stringify(input.constraints),
        input.status,
        input.solvedAt,
        now,
        input.featured ? 1 : 0,
      ),
      ...relations,
    ]);
  }

  async updateStudioAlgorithmProblem(
    input: StudioAlgorithmProblemInput,
    expectedVersion: number,
  ): Promise<number | null> {
    const d1 = database();
    const writeToken = crypto.randomUUID();
    const relations = this.prepareRelations(d1, input, writeToken);
    const results = await d1.batch([
      d1.prepare(`
        UPDATE algorithm_problems
        SET
          platform = ?, problem_id = ?, title = ?, difficulty = ?, source_url = ?,
          summary = ?, statement = ?, constraints = ?, status = ?, solved_at = ?,
          updated_at = ?, featured = ?, row_version = row_version + 1,
          write_token = ?
        WHERE slug = ? AND row_version = ?
      `).bind(
        input.platform,
        input.problemId,
        input.title,
        input.difficulty,
        input.sourceUrl,
        input.summary,
        input.statement,
        JSON.stringify(input.constraints),
        input.status,
        input.solvedAt,
        new Date().toISOString(),
        input.featured ? 1 : 0,
        writeToken,
        input.slug,
        expectedVersion,
      ),
      ...relations,
      d1.prepare(`
        UPDATE algorithm_problems
        SET write_token = NULL
        WHERE slug = ? AND write_token = ?
      `).bind(input.slug, writeToken),
    ]);
    return results[0].meta.changes ? expectedVersion + 1 : null;
  }

  async archiveStudioAlgorithmProblem(
    slug: string,
    expectedVersion: number,
  ): Promise<number | null> {
    const result = await database().prepare(`
      UPDATE algorithm_problems
      SET
        status = 'archived', updated_at = ?,
        row_version = row_version + 1
      WHERE slug = ? AND row_version = ?
    `).bind(new Date().toISOString(), slug, expectedVersion).run();
    return result.meta.changes ? expectedVersion + 1 : null;
  }

  private async readProblem(slug: string, publishedOnly: boolean): Promise<{
    problem: ProblemRow;
    solutions: SolutionRow[];
    codes: CodeRow[];
    tags: TagRow[];
    references: ReferenceRow[];
  } | null> {
    const d1 = database();
    const [problemResult, solutionResult, codeResult, tagResult, referenceResult] =
      await d1.batch([
      d1.prepare(`
        SELECT
          p.*,
          (SELECT COUNT(*) FROM algorithm_solutions s WHERE s.problem_slug = p.slug)
            AS solution_count,
          (
            SELECT GROUP_CONCAT(DISTINCT CASE
              WHEN cb.label <> '' THEN cb.label
              ELSE cb.language
            END)
            FROM algorithm_solutions s
            INNER JOIN algorithm_code_blocks cb ON cb.solution_id = s.id
            WHERE s.problem_slug = p.slug
          ) AS languages
        FROM algorithm_problems p
        WHERE p.slug = ? ${publishedOnly ? "AND p.status = 'published'" : ""}
        LIMIT 1
      `).bind(slug),
      d1.prepare(`
        SELECT *
        FROM algorithm_solutions
        WHERE problem_slug = ?
        ORDER BY sort_order
      `).bind(slug),
      d1.prepare(`
        SELECT cb.*
        FROM algorithm_code_blocks cb
        INNER JOIN algorithm_solutions s ON s.id = cb.solution_id
        WHERE s.problem_slug = ?
        ORDER BY s.sort_order, cb.sort_order
      `).bind(slug),
      d1.prepare(`
        SELECT apt.problem_slug, t.name
        FROM algorithm_problem_tags apt
        INNER JOIN tags t ON t.id = apt.tag_id
        WHERE apt.problem_slug = ?
        ORDER BY t.name
      `).bind(slug),
      d1.prepare(`
        SELECT *
        FROM algorithm_references
        WHERE problem_slug = ?
        ORDER BY sort_order
      `).bind(slug),
    ]);
    const problem = problemResult.results?.[0] as ProblemRow | undefined;
    if (!problem) return null;
    return {
      problem,
      solutions: (solutionResult.results ?? []) as SolutionRow[],
      codes: (codeResult.results ?? []) as CodeRow[],
      tags: (tagResult.results ?? []) as TagRow[],
      references: (referenceResult.results ?? []) as ReferenceRow[],
    };
  }

  private prepareRelations(
    d1: D1Database,
    input: StudioAlgorithmProblemInput,
    writeToken?: string,
  ): D1PreparedStatement[] {
    if (!writeToken) return [
      d1.prepare("DELETE FROM algorithm_references WHERE problem_slug = ?").bind(input.slug),
      d1.prepare("DELETE FROM algorithm_solutions WHERE problem_slug = ?").bind(input.slug),
      d1.prepare("DELETE FROM algorithm_problem_tags WHERE problem_slug = ?").bind(input.slug),
      ...input.tags.map((tag) =>
        d1.prepare(`
          INSERT INTO tags (id, name)
          VALUES (?, ?)
          ON CONFLICT(name) DO NOTHING
        `).bind(`tag-${crypto.randomUUID()}`, tag)
      ),
      ...input.solutions.flatMap((solution, solutionIndex) => [
        d1.prepare(`
          INSERT INTO algorithm_solutions (
            id, problem_slug, title, intuition, steps, proof, time_complexity,
            space_complexity, pitfalls, sort_order
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(
          storageId(input.slug, solution.id),
          input.slug,
          solution.title,
          solution.intuition,
          JSON.stringify(solution.steps),
          solution.proof,
          solution.timeComplexity,
          solution.spaceComplexity,
          JSON.stringify(solution.pitfalls),
          solutionIndex,
        ),
        ...solution.codeBlocks.map((block, codeIndex) =>
          d1.prepare(`
            INSERT INTO algorithm_code_blocks (
              id, solution_id, language, label, code, sort_order
            ) VALUES (?, ?, ?, ?, ?, ?)
          `).bind(
            storageId(input.slug, block.id),
            storageId(input.slug, solution.id),
            block.language,
            block.label,
            block.code,
            codeIndex,
          )
        ),
      ]),
      ...input.references.map((reference, referenceIndex) =>
        d1.prepare(`
          INSERT INTO algorithm_references (
            id, problem_slug, solution_id, title, author, url, note,
            accessed_at, sort_order
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(
          storageId(input.slug, reference.id),
          input.slug,
          reference.solutionId ? storageId(input.slug, reference.solutionId) : null,
          reference.title,
          reference.author,
          reference.url,
          reference.note,
          reference.accessedAt,
          referenceIndex,
        )
      ),
      ...input.tags.map((tag) =>
        d1.prepare(`
          INSERT INTO algorithm_problem_tags (problem_slug, tag_id)
          SELECT ?, id
          FROM tags
          WHERE name = ?
        `).bind(input.slug, tag)
      ),
    ];

    const guard = `
      EXISTS (
        SELECT 1 FROM algorithm_problems
        WHERE slug = ? AND write_token = ?
      )
    `;
    return [
      d1.prepare(`
        DELETE FROM algorithm_references
        WHERE problem_slug = ? AND ${guard}
      `).bind(input.slug, input.slug, writeToken),
      d1.prepare(`
        DELETE FROM algorithm_solutions
        WHERE problem_slug = ? AND ${guard}
      `).bind(input.slug, input.slug, writeToken),
      d1.prepare(`
        DELETE FROM algorithm_problem_tags
        WHERE problem_slug = ? AND ${guard}
      `).bind(input.slug, input.slug, writeToken),
      ...input.tags.map((tag) =>
        d1.prepare(`
          INSERT OR IGNORE INTO tags (id, name)
          SELECT ?, ?
          WHERE ${guard}
        `).bind(
          `tag-${crypto.randomUUID()}`,
          tag,
          input.slug,
          writeToken,
        )
      ),
      ...input.solutions.flatMap((solution, solutionIndex) => [
        d1.prepare(`
          INSERT INTO algorithm_solutions (
            id, problem_slug, title, intuition, steps, proof, time_complexity,
            space_complexity, pitfalls, sort_order
          )
          SELECT ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
          WHERE ${guard}
        `).bind(
          storageId(input.slug, solution.id),
          input.slug,
          solution.title,
          solution.intuition,
          JSON.stringify(solution.steps),
          solution.proof,
          solution.timeComplexity,
          solution.spaceComplexity,
          JSON.stringify(solution.pitfalls),
          solutionIndex,
          input.slug,
          writeToken,
        ),
        ...solution.codeBlocks.map((block, codeIndex) =>
          d1.prepare(`
            INSERT INTO algorithm_code_blocks (
              id, solution_id, language, label, code, sort_order
            )
            SELECT ?, ?, ?, ?, ?, ?
            WHERE ${guard}
          `).bind(
            storageId(input.slug, block.id),
            storageId(input.slug, solution.id),
            block.language,
            block.label,
            block.code,
            codeIndex,
            input.slug,
            writeToken,
          )
        ),
      ]),
      ...input.references.map((reference, referenceIndex) =>
        d1.prepare(`
          INSERT INTO algorithm_references (
            id, problem_slug, solution_id, title, author, url, note,
            accessed_at, sort_order
          )
          SELECT ?, ?, ?, ?, ?, ?, ?, ?, ?
          WHERE ${guard}
        `).bind(
          storageId(input.slug, reference.id),
          input.slug,
          reference.solutionId ? storageId(input.slug, reference.solutionId) : null,
          reference.title,
          reference.author,
          reference.url,
          reference.note,
          reference.accessedAt,
          referenceIndex,
          input.slug,
          writeToken,
        )
      ),
      ...input.tags.map((tag) =>
        d1.prepare(`
          INSERT INTO algorithm_problem_tags (problem_slug, tag_id)
          SELECT ?, id
          FROM tags
          WHERE name = ? AND ${guard}
        `).bind(input.slug, tag, input.slug, writeToken)
      ),
    ];
  }
}
