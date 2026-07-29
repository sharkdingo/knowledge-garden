import {
  StudioConflictError,
  StudioValidationError,
} from "../application/studio-validation";

type JsonBody = Record<string, unknown>;

export function studioJson(
  body: JsonBody,
  init: ResponseInit = {},
): Response {
  const headers = new Headers(init.headers);
  headers.set("Cache-Control", "no-store");
  return Response.json(body, {
    ...init,
    headers,
  });
}

export function studioErrorResponse(
  error: unknown,
  fallbackMessage: string,
  options: {
    validationStatus?: number;
  } = {},
): Response {
  if (error instanceof StudioConflictError) {
    return studioJson({ error: error.message }, { status: 409 });
  }
  if (error instanceof StudioValidationError) {
    return studioJson(
      { error: error.message },
      { status: options.validationStatus ?? 400 },
    );
  }
  return studioJson({ error: fallbackMessage }, { status: 500 });
}
