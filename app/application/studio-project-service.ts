import type {
  StudioProject,
  StudioProjectInput,
  StudioProjectRepository,
} from "../domain/studio";
import { StudioValidationError } from "./studio-validation";

const ID_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const VISUALS = new Set(["iot", "canvas", "agent"]);

function required(value: string, label: string, max: number): string {
  const normalized = value.trim();
  if (!normalized) throw new StudioValidationError(`${label}不能为空。`);
  if (normalized.length > max) {
    throw new StudioValidationError(`${label}不能超过 ${max} 个字符。`);
  }
  return normalized;
}

function optionalUrl(value: string | undefined, label: string): string | undefined {
  const normalized = value?.trim();
  if (!normalized) return undefined;
  try {
    const url = new URL(normalized);
    if (!["http:", "https:"].includes(url.protocol)) throw new Error();
    return url.toString();
  } catch {
    throw new StudioValidationError(`${label}需要是有效的 HTTP(S) 地址。`);
  }
}

function normalize(input: StudioProjectInput): StudioProjectInput {
  const id = input.id.trim().toLowerCase();
  if (!ID_PATTERN.test(id) || id.length > 80) {
    throw new StudioValidationError("项目 ID 只能包含小写字母、数字和单个连字符。");
  }
  if (!VISUALS.has(input.visual)) {
    throw new StudioValidationError("项目视觉类型无效。");
  }
  if (!Number.isInteger(input.sortOrder) || input.sortOrder < 0 || input.sortOrder > 9999) {
    throw new StudioValidationError("排序需要是 0–9999 之间的整数。");
  }
  if (!/^\d{4}(?:[.-]\d{2})?(?:[.-]\d{2})?$/.test(input.updated.trim())) {
    throw new StudioValidationError("更新日期请使用 YYYY、YYYY.MM 或 YYYY.MM.DD。");
  }
  const stack = [...new Set(input.stack.map((item) => item.trim()).filter(Boolean))];
  if (!stack.length) throw new StudioValidationError("技术栈至少需要一项。");
  return {
    ...input,
    id,
    name: required(input.name, "项目名称", 120),
    subtitle: required(input.subtitle, "项目副标题", 160),
    description: required(input.description, "项目说明", 800),
    status: required(input.status, "项目状态", 40),
    statusLabel: required(input.statusLabel, "状态说明", 80),
    category: required(input.category, "项目分类", 80),
    stack: stack.slice(0, 12),
    updated: input.updated.trim(),
    relatedArticleSlug: input.relatedArticleSlug?.trim() || undefined,
    repositoryUrl: optionalUrl(input.repositoryUrl, "代码仓库地址"),
    demoUrl: optionalUrl(input.demoUrl, "演示地址"),
  };
}

export class StudioProjectService {
  constructor(private readonly repository: StudioProjectRepository) {}

  async list(): Promise<StudioProject[]> {
    return [...await this.repository.listStudioProjects()];
  }

  get(id: string): Promise<StudioProject | null> {
    return this.repository.findStudioProject(id);
  }

  async create(input: StudioProjectInput) {
    const normalized = normalize(input);
    if (await this.repository.findStudioProject(normalized.id)) {
      throw new StudioValidationError("这个项目 ID 已经被使用。");
    }
    await this.repository.createStudioProject(normalized);
  }

  async update(id: string, input: StudioProjectInput) {
    const normalized = normalize(input);
    if (normalized.id !== id) {
      throw new StudioValidationError("项目 ID 创建后不能直接修改。");
    }
    if (!await this.repository.findStudioProject(id)) {
      throw new StudioValidationError("找不到需要更新的项目。");
    }
    await this.repository.updateStudioProject(normalized);
  }

  archive(id: string) {
    return this.repository.archiveStudioProject(id);
  }
}
