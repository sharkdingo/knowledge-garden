"use client";

type StudioErrorPayload = {
  error?: unknown;
  signIn?: unknown;
};

export async function studioRequest<T extends object>(
  input: RequestInfo | URL,
  init: RequestInit | undefined,
  fallbackMessage: string,
): Promise<T> {
  let response: Response;
  try {
    response = await fetch(input, init);
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") throw error;
    throw new Error("网络连接中断，请检查连接后重试。");
  }

  let payload: StudioErrorPayload;
  try {
    const value: unknown = await response.json();
    payload = value && typeof value === "object" && !Array.isArray(value)
      ? value as StudioErrorPayload
      : {};
  } catch {
    throw new Error(
      response.ok
        ? fallbackMessage
        : "服务暂时无法返回有效结果，请稍后重试。",
    );
  }

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error("登录状态已失效。你的未保存内容仍保留在当前页面，请重新登录后再保存。");
    }
    throw new Error(
      typeof payload.error === "string" && payload.error.trim()
        ? payload.error
        : fallbackMessage,
    );
  }

  return payload as T;
}
