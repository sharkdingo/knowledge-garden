import { ArticleEngagementError } from "../../../../application/article-engagement-service";
import { contentServices } from "../../../../composition/content";

type Context = { params: Promise<{ slug: string }> };
type ReactionInput = { visitorKey?: unknown; reactionId?: unknown };

const noStore = { "Cache-Control": "no-store" };

function textValue(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function errorResponse(error: unknown): Response {
  const known = error instanceof ArticleEngagementError;
  const invalidJson = error instanceof SyntaxError;
  return Response.json(
    {
      error: known
        ? error.message
        : invalidJson
          ? "Invalid reader response payload."
          : "Reader response service is unavailable.",
    },
    { status: known || invalidJson ? 400 : 500, headers: noStore },
  );
}

export async function GET(request: Request, { params }: Context) {
  try {
    const { slug } = await params;
    const visitorKey =
      new URL(request.url).searchParams.get("visitorKey")?.trim() || undefined;
    const snapshot = await contentServices.engagement.getSnapshot(slug, visitorKey);
    return Response.json(snapshot, { headers: noStore });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: Request, { params }: Context) {
  try {
    const { slug } = await params;
    const input = await request.json() as ReactionInput | null;
    const snapshot = await contentServices.engagement.react(
      slug,
      textValue(input?.visitorKey),
      textValue(input?.reactionId),
    );
    return Response.json(snapshot, { headers: noStore });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(request: Request, { params }: Context) {
  try {
    const { slug } = await params;
    const input = await request.json() as ReactionInput | null;
    const snapshot = await contentServices.engagement.remove(
      slug,
      textValue(input?.visitorKey),
    );
    return Response.json(snapshot, { headers: noStore });
  } catch (error) {
    return errorResponse(error);
  }
}
