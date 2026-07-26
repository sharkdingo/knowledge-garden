import { StudioValidationError } from "../../../../application/studio-validation";
import { contentServices } from "../../../../composition/content";
import type { StudioAlgorithmProblemInput } from "../../../../domain/studio";
import { authorizeStudioApi } from "../../../../studio/studio-auth";
import { readStudioJson } from "../../../../studio/studio-request";

type Context = { params: Promise<{ slug: string }> };

export async function PUT(request: Request, { params }: Context) {
  const access = await authorizeStudioApi();
  if (!access.authorized) return access.response;
  const { slug } = await params;
  try {
    const input = await readStudioJson<StudioAlgorithmProblemInput>(request);
    await contentServices.studio.algorithms.update(slug, input);
    return Response.json({ ok: true, slug }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "无法保存题解。" },
      {
        status: error instanceof StudioValidationError ? 400 : 500,
        headers: { "Cache-Control": "no-store" },
      },
    );
  }
}

export async function DELETE(_request: Request, { params }: Context) {
  const access = await authorizeStudioApi();
  if (!access.authorized) return access.response;
  const { slug } = await params;
  try {
    await contentServices.studio.algorithms.archive(slug);
    return Response.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "无法归档题解。" },
      {
        status: error instanceof StudioValidationError ? 400 : 500,
        headers: { "Cache-Control": "no-store" },
      },
    );
  }
}
