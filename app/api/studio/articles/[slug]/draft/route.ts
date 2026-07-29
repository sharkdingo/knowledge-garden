import type { StudioArticleInput } from "../../../../../domain/studio";
import { contentServices } from "../../../../../composition/content";
import { authorizeStudioApi } from "../../../../../studio/studio-auth";
import {
  assertStudioMutationRequest,
  readStudioJson,
} from "../../../../../studio/studio-request";
import {
  studioErrorResponse,
  studioJson,
} from "../../../../../studio/studio-response";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const access = await authorizeStudioApi();
  if (!access.authorized) return access.response;
  const { slug } = await params;
  try {
    const input = await readStudioJson<StudioArticleInput>(request);
    const draft = await contentServices.studio.articles.autosave(slug, input);
    return studioJson(
      { ok: true, savedAt: draft.savedAt },
    );
  } catch (error) {
    return studioErrorResponse(error, "无法自动保存文章。");
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
    await contentServices.studio.articles.discardDraft(slug);
    return studioJson({ ok: true });
  } catch (error) {
    return studioErrorResponse(error, "无法移除自动备份。");
  }
}
