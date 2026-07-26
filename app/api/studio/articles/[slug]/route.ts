import type { StudioArticleInput } from "../../../../domain/studio";
import { StudioValidationError } from "../../../../application/studio-article-service";
import { contentServices } from "../../../../composition/content";
import { authorizeStudioApi } from "../../../../studio/studio-auth";
import { readStudioJson } from "../../../../studio/studio-request";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const access = await authorizeStudioApi();
  if (!access.authorized) return access.response;
  const { slug } = await params;
  try {
    const input = await readStudioJson<StudioArticleInput>(request);
    await contentServices.studio.articles.update(slug, input);
    return Response.json(
      { ok: true, slug },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    const status = error instanceof StudioValidationError ? 400 : 500;
    return Response.json(
      { error: error instanceof Error ? error.message : "无法保存文章。" },
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
  try {
    await contentServices.studio.articles.archive(slug);
    return Response.json(
      { ok: true },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "无法归档文章。" },
      { status: 409, headers: { "Cache-Control": "no-store" } },
    );
  }
}
