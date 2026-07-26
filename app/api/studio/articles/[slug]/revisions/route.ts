import { StudioValidationError } from "../../../../../application/studio-article-service";
import { contentServices } from "../../../../../composition/content";
import { authorizeStudioApi } from "../../../../../studio/studio-auth";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const access = await authorizeStudioApi();
  if (!access.authorized) return access.response;
  const { slug } = await params;
  const revisions = await contentServices.studio.articles.revisions(slug);
  return Response.json(
    { revisions },
    { headers: { "Cache-Control": "no-store" } },
  );
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const access = await authorizeStudioApi();
  if (!access.authorized) return access.response;
  const { slug } = await params;
  try {
    const body = await request.json() as { revisionId?: string };
    if (!body.revisionId) throw new StudioValidationError("缺少需要恢复的版本。");
    const article = await contentServices.studio.articles.restore(slug, body.revisionId);
    return Response.json(
      { ok: true, article },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    const status = error instanceof StudioValidationError ? 400 : 500;
    return Response.json(
      { error: error instanceof Error ? error.message : "无法恢复文章版本。" },
      { status, headers: { "Cache-Control": "no-store" } },
    );
  }
}
