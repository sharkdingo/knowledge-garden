import { contentServices } from "../../../composition/content";
import { authorizeStudioApi } from "../../../studio/studio-auth";
import { readStudioJson } from "../../../studio/studio-request";
import { recordStudioAudit } from "../../../studio/studio-audit";
import { studioErrorResponse, studioJson } from "../../../studio/studio-response";

export async function GET() {
  const access = await authorizeStudioApi();
  if (!access.authorized) return access.response;
  try {
    return studioJson({
      restorePoints: await contentServices.studio.backup.restorePoints(),
    });
  } catch (error) {
    return studioErrorResponse(error, "无法读取安全点。");
  }
}

export async function POST(request: Request) {
  const access = await authorizeStudioApi();
  if (!access.authorized) return access.response;
  try {
    const { id } = await readStudioJson<{ id: string }>(request);
    const preview = await contentServices.studio.backup.restorePoint(id);
    await recordStudioAudit(access.user, {
      action: "backup.restore-point",
      resourceType: "backup",
      resourceId: id,
      outcome: "succeeded",
      metadata: { totalRows: preview.totalRows },
    });
    return studioJson(
      { ok: true, restoredRows: preview.totalRows },
    );
  } catch (error) {
    return studioErrorResponse(error, "无法恢复安全点。");
  }
}
