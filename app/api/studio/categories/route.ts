import type { StudioCategoryInput } from "../../../domain/studio";
import { contentServices } from "../../../composition/content";
import { authorizeStudioApi } from "../../../studio/studio-auth";
import { readStudioJson } from "../../../studio/studio-request";
import { recordStudioAudit } from "../../../studio/studio-audit";
import { studioErrorResponse, studioJson } from "../../../studio/studio-response";

export async function GET() {
  const access = await authorizeStudioApi();
  if (!access.authorized) return access.response;
  return studioJson({ categories: await contentServices.studio.categories.list() });
}

export async function POST(request: Request) {
  const access = await authorizeStudioApi();
  if (!access.authorized) return access.response;
  try {
    const input = await readStudioJson<StudioCategoryInput>(request);
    await contentServices.studio.categories.create(input);
    await recordStudioAudit(access.user, {
      action: "category.create",
      resourceType: "category",
      resourceId: input.id,
      outcome: "succeeded",
    });
    return studioJson({ ok: true }, { status: 201 });
  } catch (error) {
    return studioErrorResponse(error, "无法创建分类。");
  }
}
