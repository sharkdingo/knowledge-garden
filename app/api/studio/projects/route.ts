import { contentServices } from "../../../composition/content";
import type { StudioProjectInput } from "../../../domain/studio";
import { authorizeStudioApi } from "../../../studio/studio-auth";
import { readStudioJson } from "../../../studio/studio-request";
import { recordStudioAudit } from "../../../studio/studio-audit";
import { studioErrorResponse, studioJson } from "../../../studio/studio-response";

export async function POST(request: Request) {
  const access = await authorizeStudioApi();
  if (!access.authorized) return access.response;
  try {
    const input = await readStudioJson<StudioProjectInput>(request);
    const id = await contentServices.studio.projects.create(input);
    await recordStudioAudit(access.user, {
      action: "project.create",
      resourceType: "project",
      resourceId: id,
      outcome: "succeeded",
    });
    return studioJson(
      { ok: true, id },
      { status: 201 },
    );
  } catch (error) {
    return studioErrorResponse(error, "无法创建项目。");
  }
}
