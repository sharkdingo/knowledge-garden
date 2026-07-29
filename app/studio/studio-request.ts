import { StudioValidationError } from "../application/studio-validation";

export function assertStudioMutationRequest(request: Request, maxBytes = 1_000_000) {
  const contentLength = Number(request.headers.get("content-length") ?? "0");
  if (Number.isFinite(contentLength) && contentLength > maxBytes) {
    throw new StudioValidationError(`请求内容不能超过 ${Math.ceil(maxBytes / 1_000_000)} MB。`);
  }
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin) {
    throw new StudioValidationError("拒绝来自其他站点的写入请求。");
  }
}

export async function readStudioJson<T extends object>(
  request: Request,
  maxBytes = 1_000_000,
): Promise<T> {
  assertStudioMutationRequest(request, maxBytes);
  const contentType = request.headers.get("content-type")?.toLowerCase() ?? "";
  if (!contentType.startsWith("application/json")) {
    throw new StudioValidationError("请求必须使用 application/json。");
  }
  const body = await request.text();
  if (new TextEncoder().encode(body).byteLength > maxBytes) {
    throw new StudioValidationError(`请求内容不能超过 ${Math.ceil(maxBytes / 1_000_000)} MB。`);
  }
  let value: unknown;
  try {
    value = JSON.parse(body);
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

export function readExpectedVersion(request: Request): number {
  const raw = request.headers.get("if-match")?.replaceAll('"', "").trim();
  const version = Number(raw);
  if (!raw || !Number.isSafeInteger(version) || version < 1) {
    throw new StudioValidationError("缺少有效的内容版本，请刷新页面后重试。");
  }
  return version;
}
