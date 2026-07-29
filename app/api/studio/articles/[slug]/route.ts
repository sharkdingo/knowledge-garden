import type { StudioArticleInput } from "../../../../domain/studio";
import { contentServices } from "../../../../composition/content";
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
  { params }: { params: Promise<{ slug: string }> },
) {
  const access = await authorizeStudioApi();
  if (!access.authorized) return access.response;
  const { slug } = await params;
  try {
    const input = await readStudioJson<StudioArticleInput>(request);
    const version = await contentServices.studio.articles.update(
      slug,
      input,
      readExpectedVersion(request),
    );
    await recordStudioAudit(access.user, {
      action: "article.update",
      resourceType: "article",
      resourceId: slug,
      outcome: "succeeded",
      metadata: { version, status: input.status },
    });
    return studioJson(
      { ok: true, slug, version },
    );
  } catch (error) {
    return studioErrorResponse(error, "无法保存文章。");
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const access = await authorizeStudioApi();
  if (!access.authorized) return access.response;
  const { slug } = await params;
  try {
    assertStudioMutationRequest(request);
    const version = await contentServices.studio.articles.archive(
      slug,
      readExpectedVersion(request),
    );
    await recordStudioAudit(access.user, {
      action: "article.archive",
      resourceType: "article",
      resourceId: slug,
      outcome: "succeeded",
      metadata: { version },
    });
    return studioJson(
      { ok: true, version },
    );
  } catch (error) {
    return studioErrorResponse(error, "无法归档文章。");
  }
}
