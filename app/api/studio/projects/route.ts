import { StudioValidationError } from "../../../application/studio-validation";
import { contentServices } from "../../../composition/content";
import type { StudioProjectInput } from "../../../domain/studio";
import { authorizeStudioApi } from "../../../studio/studio-auth";
import { readStudioJson } from "../../../studio/studio-request";

export async function POST(request: Request) {
  const access = await authorizeStudioApi();
  if (!access.authorized) return access.response;
  try {
    const input = await readStudioJson<StudioProjectInput>(request);
    const id = await contentServices.studio.projects.create(input);
    return Response.json(
      { ok: true, id },
      { status: 201, headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    const status = error instanceof StudioValidationError ? 400 : 500;
    return Response.json(
      { error: error instanceof Error ? error.message : "无法创建项目。" },
      { status, headers: { "Cache-Control": "no-store" } },
    );
  }
}
