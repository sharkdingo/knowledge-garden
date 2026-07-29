import { StudioValidationError } from "../../../../../application/studio-validation";
import { contentServices } from "../../../../../composition/content";
import { authorizeStudioApi } from "../../../../../studio/studio-auth";
import { readExpectedVersion, readStudioJson } from "../../../../../studio/studio-request";
import { recordStudioAudit } from "../../../../../studio/studio-audit";
import {
  studioErrorResponse,
  studioJson,
} from "../../../../../studio/studio-response";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const access = await authorizeStudioApi();
  if (!access.authorized) return access.response;
  const { slug } = await params;
  try {
    const revisions = await contentServices.studio.articles.revisions(slug);
    return studioJson({ revisions });
  } catch (error) {
    return studioErrorResponse(error, "无法读取文章版本。");
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const access = await authorizeStudioApi();
  if (!access.authorized) return access.response;
  const { slug } = await params;
  try {
    const body = await readStudioJson<{ revisionId?: string }>(request);
    if (typeof body.revisionId !== "string" || !body.revisionId.trim()) {
      throw new StudioValidationError("缺少需要恢复的版本。");
    }
    const article = await contentServices.studio.articles.restore(
      slug,
      body.revisionId.trim(),
      readExpectedVersion(request),
    );
    await recordStudioAudit(access.user, {
      action: "article.restore",
      resourceType: "article",
      resourceId: slug,
      outcome: "succeeded",
      metadata: { version: article.version },
    });
    return studioJson(
      { ok: true, article },
    );
  } catch (error) {
    return studioErrorResponse(error, "无法恢复文章版本。");
  }
}
