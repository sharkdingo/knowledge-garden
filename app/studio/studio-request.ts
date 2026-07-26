import { StudioValidationError } from "../application/studio-validation";

export async function readStudioJson<T extends object>(
  request: Request,
): Promise<T> {
  let value: unknown;
  try {
    value = await request.json();
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new StudioValidationError("请求内容不是有效的 JSON。");
    }
    throw error;
  }
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new StudioValidationError("请求内容必须是一个对象。");
  }
  return value as T;
}
