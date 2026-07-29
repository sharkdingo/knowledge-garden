import type { StudioSiteSettings } from "../../../domain/studio";
import { contentServices } from "../../../composition/content";
import { authorizeStudioApi } from "../../../studio/studio-auth";
import { readStudioJson } from "../../../studio/studio-request";
import { recordStudioAudit } from "../../../studio/studio-audit";
import { studioErrorResponse, studioJson } from "../../../studio/studio-response";

export async function PUT(request: Request) {
  const access = await authorizeStudioApi();
  if (!access.authorized) return access.response;
  try {
    const settings = await readStudioJson<StudioSiteSettings>(request);
    const version = await contentServices.studio.site.update(settings);
    await recordStudioAudit(access.user, {
      action: "site.update",
      resourceType: "site",
      resourceId: "profile",
      outcome: "succeeded",
    });
    return studioJson(
      { ok: true, version },
    );
  } catch (error) {
    return studioErrorResponse(error, "无法保存站点设置。");
  }
}
