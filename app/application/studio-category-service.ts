import type {
  StudioCategoryInput,
  StudioCategoryRepository,
} from "../domain/studio";
import { StudioValidationError } from "./studio-validation";

const ID = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function normalize(input: StudioCategoryInput): StudioCategoryInput {
  const id = input?.id?.trim().toLowerCase() ?? "";
  const name = input?.name?.trim() ?? "";
  const description = input?.description?.trim() ?? "";
  if (!ID.test(id) || id.length > 60) {
    throw new StudioValidationError("分类 ID 只能包含小写字母、数字和单个连字符。");
  }
  if (!name || name.length > 40) {
    throw new StudioValidationError("分类名称不能为空且不能超过 40 个字符。");
  }
  if (description.length > 160) {
    throw new StudioValidationError("分类说明不能超过 160 个字符。");
  }
  const sortOrder = Number(input.sortOrder);
  if (!Number.isInteger(sortOrder) || sortOrder < 0 || sortOrder > 9999) {
    throw new StudioValidationError("排序值需要是 0–9999 的整数。");
  }
  return { id, name, description, sortOrder };
}

export class StudioCategoryService {
  constructor(private readonly repository: StudioCategoryRepository) {}
  async list() { return [...await this.repository.listStudioCategories()]; }
  async create(input: StudioCategoryInput) {
    await this.repository.createStudioCategory(normalize(input));
  }
  async update(input: StudioCategoryInput) {
    await this.repository.updateStudioCategory(normalize(input));
  }
  async delete(id: string) {
    const result = await this.repository.deleteStudioCategory(id);
    if (result === "in-use") {
      throw new StudioValidationError("这个分类仍被文章使用，需先调整文章分类。");
    }
    if (result === "missing") {
      throw new StudioValidationError("找不到需要删除的分类。");
    }
  }
}
