import type { StudioCategoryInput } from "../../../../domain/studio";
import { contentServices } from "../../../../composition/content";
import { authorizeStudioApi } from "../../../../studio/studio-auth";
import { assertStudioMutationRequest, readStudioJson } from "../../../../studio/studio-request";
import { recordStudioAudit } from "../../../../studio/studio-audit";
import { studioErrorResponse, studioJson } from "../../../../studio/studio-response";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const access = await authorizeStudioApi();
  if (!access.authorized) return access.response;
  try {
    const { id } = await params;
    const input = await readStudioJson<StudioCategoryInput>(request);
    await contentServices.studio.categories.update({ ...input, id });
    await recordStudioAudit(access.user, {
      action: "category.update",
      resourceType: "category",
      resourceId: id,
      outcome: "succeeded",
    });
    return studioJson({ ok: true });
  } catch (error) {
    return studioErrorResponse(error, "无法保存分类。");
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const access = await authorizeStudioApi();
  if (!access.authorized) return access.response;
  try {
    const { id } = await params;
    assertStudioMutationRequest(request);
    await contentServices.studio.categories.delete(id);
    await recordStudioAudit(access.user, {
      action: "category.delete",
      resourceType: "category",
      resourceId: id,
      outcome: "succeeded",
    });
    return studioJson({ ok: true });
  } catch (error) {
    return studioErrorResponse(
      error,
      "无法删除分类。",
      { validationStatus: 409 },
    );
  }
}
