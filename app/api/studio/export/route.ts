import { contentServices } from "../../../composition/content";
import { authorizeStudioApi } from "../../../studio/studio-auth";
import { recordStudioAudit } from "../../../studio/studio-audit";
import { studioErrorResponse } from "../../../studio/studio-response";

export async function GET() {
  const access = await authorizeStudioApi();
  if (!access.authorized) return access.response;
  try {
    const snapshot = await contentServices.studio.backup.export();
    await recordStudioAudit(access.user, {
      action: "backup.export",
      resourceType: "backup",
      resourceId: snapshot.exportedAt,
      outcome: "succeeded",
    });
    const date = snapshot.exportedAt.slice(0, 10);
    return new Response(JSON.stringify(snapshot, null, 2), {
      headers: {
        "Cache-Control": "no-store",
        "Content-Disposition": `attachment; filename="knowledge-garden-${date}.json"`,
        "Content-Type": "application/json; charset=utf-8",
      },
    });
  } catch (error) {
    return studioErrorResponse(error, "无法生成备份。");
  }
}
