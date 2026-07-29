import { contentServices } from "../../../../composition/content";
import type { StudioAlgorithmProblemInput } from "../../../../domain/studio";
import { authorizeStudioApi } from "../../../../studio/studio-auth";
import {
  assertStudioMutationRequest,
  readExpectedVersion,
  readStudioJson,
} from "../../../../studio/studio-request";
import { recordStudioAudit } from "../../../../studio/studio-audit";
import { studioErrorResponse, studioJson } from "../../../../studio/studio-response";

type Context = { params: Promise<{ slug: string }> };

export async function PUT(request: Request, { params }: Context) {
  const access = await authorizeStudioApi();
  if (!access.authorized) return access.response;
  const { slug } = await params;
  try {
    const input = await readStudioJson<StudioAlgorithmProblemInput>(request);
    const version = await contentServices.studio.algorithms.update(
      slug,
      input,
      readExpectedVersion(request),
    );
    await recordStudioAudit(access.user, {
      action: "problem.update",
      resourceType: "problem",
      resourceId: slug,
      outcome: "succeeded",
      metadata: { version, status: input.status },
    });
    return studioJson(
      { ok: true, slug, version },
    );
  } catch (error) {
    return studioErrorResponse(error, "无法保存题解。");
  }
}

export async function DELETE(request: Request, { params }: Context) {
  const access = await authorizeStudioApi();
  if (!access.authorized) return access.response;
  const { slug } = await params;
  try {
    assertStudioMutationRequest(request);
    const version = await contentServices.studio.algorithms.archive(
      slug,
      readExpectedVersion(request),
    );
    await recordStudioAudit(access.user, {
      action: "problem.archive",
      resourceType: "problem",
      resourceId: slug,
      outcome: "succeeded",
      metadata: { version },
    });
    return studioJson(
      { ok: true, version },
    );
  } catch (error) {
    return studioErrorResponse(error, "无法归档题解。");
  }
}
