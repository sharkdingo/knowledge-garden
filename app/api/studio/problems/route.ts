import { StudioValidationError } from "../../../application/studio-validation";
import { contentServices } from "../../../composition/content";
import type { StudioAlgorithmProblemInput } from "../../../domain/studio";
import { authorizeStudioApi } from "../../../studio/studio-auth";
import { readStudioJson } from "../../../studio/studio-request";

export async function POST(request: Request) {
  const access = await authorizeStudioApi();
  if (!access.authorized) return access.response;
  try {
    const input = await readStudioJson<StudioAlgorithmProblemInput>(request);
    const slug = await contentServices.studio.algorithms.create(input);
    return Response.json(
      { ok: true, slug },
      { status: 201, headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "无法创建题解。" },
      {
        status: error instanceof StudioValidationError ? 400 : 500,
        headers: { "Cache-Control": "no-store" },
      },
    );
  }
}
