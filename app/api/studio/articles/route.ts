import type { StudioArticleInput } from "../../../domain/studio";
import { contentServices } from "../../../composition/content";
import { authorizeStudioApi } from "../../../studio/studio-auth";
import { readStudioJson } from "../../../studio/studio-request";
import { recordStudioAudit } from "../../../studio/studio-audit";
import { studioErrorResponse, studioJson } from "../../../studio/studio-response";

export async function POST(request: Request) {
  const access = await authorizeStudioApi();
  if (!access.authorized) return access.response;
  try {
    const input = await readStudioJson<StudioArticleInput>(request);
    const slug = await contentServices.studio.articles.create(input);
    await recordStudioAudit(access.user, {
      action: "article.create",
      resourceType: "article",
      resourceId: slug,
      outcome: "succeeded",
      metadata: { status: input.status },
    });
    return studioJson(
      { ok: true, slug },
      { status: 201 },
    );
  } catch (error) {
    return studioErrorResponse(error, "无法创建文章。");
  }
}
