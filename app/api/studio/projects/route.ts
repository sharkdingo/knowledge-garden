import { StudioValidationError } from "../../../application/studio-validation";
import { contentServices } from "../../../composition/content";
import type { StudioProjectInput } from "../../../domain/studio";
import { authorizeStudioApi } from "../../../studio/studio-auth";

export async function POST(request: Request) {
  const access = await authorizeStudioApi();
  if (!access.authorized) return access.response;
  try {
    const input = await request.json() as StudioProjectInput;
    await contentServices.studio.projects.create(input);
    return Response.json(
      { ok: true, id: input.id.trim().toLowerCase() },
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
