import { contentServices } from "../../composition/content";

export async function GET() {
  try {
    const entries = await contentServices.discovery.buildSearchIndex();
    return Response.json(
      { entries },
      { headers: { "Cache-Control": "public, max-age=60, s-maxage=300" } },
    );
  } catch {
    return Response.json(
      { error: "暂时无法加载搜索索引。" },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}
