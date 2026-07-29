import { contentServices } from "../../../../composition/content";
import type { StudioProjectInput } from "../../../../domain/studio";
import { authorizeStudioApi } from "../../../../studio/studio-auth";
import {
  assertStudioMutationRequest,
  readExpectedVersion,
  readStudioJson,
} from "../../../../studio/studio-request";
import { recordStudioAudit } from "../../../../studio/studio-audit";
import { studioErrorResponse, studioJson } from "../../../../studio/studio-response";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const access = await authorizeStudioApi();
  if (!access.authorized) return access.response;
  const { id } = await params;
  try {
    const input = await readStudioJson<StudioProjectInput>(request);
    const version = await contentServices.studio.projects.update(
      id,
      input,
      readExpectedVersion(request),
    );
    await recordStudioAudit(access.user, {
      action: "project.update",
      resourceType: "project",
      resourceId: id,
      outcome: "succeeded",
      metadata: { version },
    });
    return studioJson(
      { ok: true, id, version },
    );
  } catch (error) {
    return studioErrorResponse(error, "无法保存项目。");
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const access = await authorizeStudioApi();
  if (!access.authorized) return access.response;
  const { id } = await params;
  try {
    assertStudioMutationRequest(request);
    const version = await contentServices.studio.projects.archive(
      id,
      readExpectedVersion(request),
    );
    await recordStudioAudit(access.user, {
      action: "project.archive",
      resourceType: "project",
      resourceId: id,
      outcome: "succeeded",
      metadata: { version },
    });
    return studioJson(
      { ok: true, version },
    );
  } catch (error) {
    return studioErrorResponse(error, "无法归档项目。");
  }
}
