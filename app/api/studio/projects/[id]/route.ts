import { StudioValidationError } from "../../../../application/studio-validation";
import { contentServices } from "../../../../composition/content";
import type { StudioProjectInput } from "../../../../domain/studio";
import { authorizeStudioApi } from "../../../../studio/studio-auth";
import { readStudioJson } from "../../../../studio/studio-request";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const access = await authorizeStudioApi();
  if (!access.authorized) return access.response;
  const { id } = await params;
  try {
    const input = await readStudioJson<StudioProjectInput>(request);
    await contentServices.studio.projects.update(id, input);
    return Response.json({ ok: true, id }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    const status = error instanceof StudioValidationError ? 400 : 500;
    return Response.json(
      { error: error instanceof Error ? error.message : "无法保存项目。" },
      { status, headers: { "Cache-Control": "no-store" } },
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const access = await authorizeStudioApi();
  if (!access.authorized) return access.response;
  const { id } = await params;
  try {
    await contentServices.studio.projects.archive(id);
    return Response.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "无法归档项目。" },
      { status: 409, headers: { "Cache-Control": "no-store" } },
    );
  }
}
