import { StudioValidationError } from "../../../application/studio-validation";
import { contentServices } from "../../../composition/content";
import type { StudioExportSnapshot } from "../../../domain/studio";
import { authorizeStudioApi } from "../../../studio/studio-auth";
import { readStudioJson } from "../../../studio/studio-request";
import { recordStudioAudit } from "../../../studio/studio-audit";
import { studioErrorResponse, studioJson } from "../../../studio/studio-response";

type RestoreRequest = {
  mode: "preview" | "apply";
  snapshot: StudioExportSnapshot;
  confirmationCode?: string;
};

export async function POST(request: Request) {
  const access = await authorizeStudioApi();
  if (!access.authorized) return access.response;
  try {
    const input = await readStudioJson<RestoreRequest>(request, 10_000_000);
    if (input.mode === "preview") {
      const preview = await contentServices.studio.backup.preview(input.snapshot);
      return studioJson(preview);
    }
    if (input.mode !== "apply") {
      throw new StudioValidationError("恢复模式无效。");
    }
    const preview = await contentServices.studio.backup.restore(
      input.snapshot,
      input.confirmationCode,
    );
    await recordStudioAudit(access.user, {
      action: "backup.restore",
      resourceType: "backup",
      resourceId: preview.checksum.slice(0, 16),
      outcome: "succeeded",
      metadata: { totalRows: preview.totalRows },
    });
    return studioJson(
      { ok: true, restoredRows: preview.totalRows },
    );
  } catch (error) {
    return studioErrorResponse(error, "无法恢复备份。");
  }
}
