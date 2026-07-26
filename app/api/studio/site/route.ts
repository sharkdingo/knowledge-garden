import type { StudioSiteSettings } from "../../../domain/studio";
import { StudioValidationError } from "../../../application/studio-validation";
import { contentServices } from "../../../composition/content";
import { authorizeStudioApi } from "../../../studio/studio-auth";
import { readStudioJson } from "../../../studio/studio-request";

export async function PUT(request: Request) {
  const access = await authorizeStudioApi();
  if (!access.authorized) return access.response;
  try {
    const settings = await readStudioJson<StudioSiteSettings>(request);
    await contentServices.studio.site.update(settings);
    return Response.json(
      { ok: true },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    const status = error instanceof StudioValidationError ? 400 : 500;
    return Response.json(
      { error: error instanceof Error ? error.message : "无法保存站点设置。" },
      { status, headers: { "Cache-Control": "no-store" } },
    );
  }
}
