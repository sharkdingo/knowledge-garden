import type {
  StudioAlgorithmProblem,
  StudioAlgorithmProblemInput,
  StudioAlgorithmProblemRepository,
} from "../domain/studio";
import { StudioValidationError } from "./studio-validation";

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const IDENTIFIER = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const DIFFICULTIES = new Set(["easy", "medium", "hard"]);
const STATUSES = new Set(["draft", "published", "archived"]);

function text(value: unknown, label: string, max: number, required: boolean): string {
  const normalized = typeof value === "string" ? value.trim() : "";
  if (required && !normalized) throw new StudioValidationError(`${label}不能为空。`);
  if (normalized.length > max) {
    throw new StudioValidationError(`${label}不能超过 ${max} 个字符。`);
  }
  return normalized;
}

function codeText(value: unknown, required: boolean): string {
  const normalized = typeof value === "string"
    ? value.replaceAll("\r\n", "\n").trimEnd()
    : "";
  if (required && !normalized.trim()) throw new StudioValidationError("代码不能为空。");
  if (normalized.length > 100_000) {
    throw new StudioValidationError("代码不能超过 100000 个字符。");
  }
  return normalized;
}

function externalUrl(value: unknown, label: string, required: boolean): string {
  const normalized = text(value, label, 500, required);
  if (!normalized) return "";
  try {
    const url = new URL(normalized);
    if (url.protocol !== "https:" && url.protocol !== "http:") throw new Error();
    return url.toString();
  } catch {
    throw new StudioValidationError(`${label}必须是有效的 HTTP(S) 地址。`);
  }
}

function normalize(input: StudioAlgorithmProblemInput): StudioAlgorithmProblemInput {
  if (
    !input ||
    !Array.isArray(input.constraints) ||
    !Array.isArray(input.tags) ||
    !Array.isArray(input.solutions) ||
    !Array.isArray(input.references)
  ) {
    throw new StudioValidationError("题解结构不完整，请刷新页面后重试。");
  }
  const published = input.status === "published";
  const slug = text(input.slug, "Slug", 100, true).toLowerCase();
  if (!SLUG.test(slug)) {
    throw new StudioValidationError("Slug 只能包含小写字母、数字和单个连字符。");
  }
  if (!STATUSES.has(input.status)) throw new StudioValidationError("题解状态无效。");
  if (!DIFFICULTIES.has(input.difficulty)) throw new StudioValidationError("题目难度无效。");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.solvedAt)) {
    throw new StudioValidationError("完成日期格式无效。");
  }

  const solutionIds = new Set<string>();
  const codeIds = new Set<string>();
  const solutions = input.solutions.map((solution, solutionIndex) => {
    if (!solution || typeof solution !== "object") {
      throw new StudioValidationError(`第 ${solutionIndex + 1} 个解法结构不完整。`);
    }
    const id = text(solution.id, `第 ${solutionIndex + 1} 个解法 ID`, 100, true).toLowerCase();
    if (!IDENTIFIER.test(id) || solutionIds.has(id)) {
      throw new StudioValidationError(`第 ${solutionIndex + 1} 个解法 ID 无效或重复。`);
    }
    solutionIds.add(id);
    const steps = (Array.isArray(solution.steps) ? solution.steps : [])
      .map((step) => text(step, "推导步骤", 500, false))
      .filter(Boolean);
    const pitfalls = (Array.isArray(solution.pitfalls) ? solution.pitfalls : [])
      .map((pitfall) => text(pitfall, "易错点", 500, false))
      .filter(Boolean);
    const codeBlocks = (Array.isArray(solution.codeBlocks) ? solution.codeBlocks : [])
      .map((block, codeIndex) => {
        if (!block || typeof block !== "object") {
          throw new StudioValidationError(
            `第 ${solutionIndex + 1} 个解法的第 ${codeIndex + 1} 份代码结构不完整。`,
          );
        }
        const codeId = text(
          block.id,
          `第 ${solutionIndex + 1} 个解法的第 ${codeIndex + 1} 份代码 ID`,
          120,
          true,
        ).toLowerCase();
        if (!IDENTIFIER.test(codeId) || codeIds.has(codeId)) {
          throw new StudioValidationError("代码块 ID 无效或重复。");
        }
        codeIds.add(codeId);
        return {
          id: codeId,
          language: text(block.language, "代码语言", 40, published),
          label: text(block.label, "代码标签", 80, false),
          code: codeText(block.code, published),
        };
      });
    if (published && (!steps.length || !codeBlocks.length)) {
      throw new StudioValidationError(`第 ${solutionIndex + 1} 个解法需要推导步骤和至少一份代码。`);
    }
    return {
      id,
      title: text(solution.title, `第 ${solutionIndex + 1} 个解法标题`, 160, published),
      intuition: text(solution.intuition, "核心直觉", 3_000, published),
      steps,
      proof: text(solution.proof, "正确性说明", 6_000, published),
      timeComplexity: text(solution.timeComplexity, "时间复杂度", 120, published),
      spaceComplexity: text(solution.spaceComplexity, "空间复杂度", 120, published),
      pitfalls,
      codeBlocks,
    };
  });
  if (published && !solutions.length) {
    throw new StudioValidationError("发布前至少需要写出一个完整解法。");
  }
  const referenceIds = new Set<string>();
  const references = input.references.map((reference, referenceIndex) => {
    if (!reference || typeof reference !== "object") {
      throw new StudioValidationError(`第 ${referenceIndex + 1} 条引用结构不完整。`);
    }
    const id = text(reference.id, `第 ${referenceIndex + 1} 条引用 ID`, 120, true)
      .toLowerCase();
    if (!IDENTIFIER.test(id) || referenceIds.has(id)) {
      throw new StudioValidationError(`第 ${referenceIndex + 1} 条引用 ID 无效或重复。`);
    }
    referenceIds.add(id);
    const solutionId = text(reference.solutionId, "引用关联解法", 100, false)
      .toLowerCase();
    if (solutionId && !solutionIds.has(solutionId)) {
      throw new StudioValidationError(`第 ${referenceIndex + 1} 条引用关联了解法中不存在的解法。`);
    }
    const accessedAt = text(
      reference.accessedAt,
      `第 ${referenceIndex + 1} 条引用访问日期`,
      10,
      published,
    );
    if (accessedAt && !/^\d{4}-\d{2}-\d{2}$/.test(accessedAt)) {
      throw new StudioValidationError(`第 ${referenceIndex + 1} 条引用访问日期格式无效。`);
    }
    return {
      id,
      solutionId: solutionId || undefined,
      title: text(reference.title, "引用标题", 240, published),
      author: text(reference.author, "引用作者", 160, published),
      url: externalUrl(reference.url, "引用链接", published),
      note: text(reference.note, "引用说明", 1_000, false),
      accessedAt,
    };
  });

  return {
    slug,
    platform: text(input.platform, "平台", 80, true),
    problemId: text(input.problemId, "题号", 80, true),
    title: text(input.title, "题目标题", 200, published),
    difficulty: input.difficulty,
    sourceUrl: externalUrl(input.sourceUrl, "原题链接", published),
    summary: text(input.summary, "摘要", 500, published),
    statement: text(input.statement, "题意重述", 8_000, published),
    constraints: input.constraints
      .map((constraint) => text(constraint, "约束", 300, false))
      .filter(Boolean)
      .slice(0, 30),
    status: input.status,
    solvedAt: input.solvedAt,
    featured: Boolean(input.featured),
    tags: [...new Set(input.tags
      .map((tag) => text(tag, "标签", 60, false))
      .filter(Boolean))].slice(0, 16),
    solutions,
    references,
  };
}

export class StudioAlgorithmProblemService {
  constructor(private readonly repository: StudioAlgorithmProblemRepository) {}

  async list() {
    return [...await this.repository.listStudioAlgorithmProblems()];
  }

  get(slug: string): Promise<StudioAlgorithmProblem | null> {
    return this.repository.findStudioAlgorithmProblem(slug);
  }

  async create(input: StudioAlgorithmProblemInput): Promise<string> {
    const normalized = normalize(input);
    if (await this.repository.findStudioAlgorithmProblem(normalized.slug)) {
      throw new StudioValidationError("这个题解 Slug 已经被使用。");
    }
    await this.repository.createStudioAlgorithmProblem(normalized);
    return normalized.slug;
  }

  async update(slug: string, input: StudioAlgorithmProblemInput): Promise<void> {
    const normalized = normalize(input);
    if (normalized.slug !== slug) {
      throw new StudioValidationError("已创建题解的 Slug 不能直接修改。");
    }
    if (!await this.repository.findStudioAlgorithmProblem(slug)) {
      throw new StudioValidationError("找不到需要更新的题解。");
    }
    await this.repository.updateStudioAlgorithmProblem(normalized);
  }

  async archive(slug: string): Promise<void> {
    if (!await this.repository.findStudioAlgorithmProblem(slug)) {
      throw new StudioValidationError("找不到需要归档的题解。");
    }
    await this.repository.archiveStudioAlgorithmProblem(slug);
  }
}
