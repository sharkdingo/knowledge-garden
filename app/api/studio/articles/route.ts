import type { StudioArticleInput } from "../../../domain/studio";
import { StudioValidationError } from "../../../application/studio-article-service";
import { contentServices } from "../../../composition/content";
import { authorizeStudioApi } from "../../../studio/studio-auth";

export async function POST(request: Request) {
  const access = await authorizeStudioApi();
  if (!access.authorized) return access.response;
  try {
    const input = await request.json() as StudioArticleInput;
    await contentServices.studio.articles.create(input);
    return Response.json(
      { ok: true, slug: input.slug.trim().toLowerCase() },
      { status: 201, headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    const status = error instanceof StudioValidationError ? 400 : 500;
    return Response.json(
      { error: error instanceof Error ? error.message : "无法创建文章。" },
      { status, headers: { "Cache-Control": "no-store" } },
    );
  }
}
