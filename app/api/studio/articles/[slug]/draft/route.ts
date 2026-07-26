import type { StudioArticleInput } from "../../../../../domain/studio";
import { StudioValidationError } from "../../../../../application/studio-article-service";
import { contentServices } from "../../../../../composition/content";
import { authorizeStudioApi } from "../../../../../studio/studio-auth";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const access = await authorizeStudioApi();
  if (!access.authorized) return access.response;
  const { slug } = await params;
  try {
    const input = await request.json() as StudioArticleInput;
    const draft = await contentServices.studio.articles.autosave(slug, input);
    return Response.json(
      { ok: true, savedAt: draft.savedAt },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    const status = error instanceof StudioValidationError ? 400 : 500;
    return Response.json(
      { error: error instanceof Error ? error.message : "无法自动保存文章。" },
      { status, headers: { "Cache-Control": "no-store" } },
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const access = await authorizeStudioApi();
  if (!access.authorized) return access.response;
  const { slug } = await params;
  await contentServices.studio.articles.discardDraft(slug);
  return Response.json(
    { ok: true },
    { headers: { "Cache-Control": "no-store" } },
  );
}
