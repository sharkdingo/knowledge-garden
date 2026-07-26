import { contentServices } from "../composition/content";

export const dynamic = "force-dynamic";

function escapeXml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

export async function GET() {
  const [articles, problems, profile] = await Promise.all([
    contentServices.articles.list(),
    contentServices.algorithms.list(),
    contentServices.site.getProfile(),
  ]);
  const { identity } = profile;
  const entries = [
    ...articles.map((article) => ({
      title: article.title,
      summary: article.summary,
      date: article.date,
      category: article.category,
      url: `${identity.url}/writing/${article.slug}`,
    })),
    ...problems.map((problem) => ({
      title: `${problem.platform} ${problem.problemId}. ${problem.title}`,
      summary: problem.summary,
      date: problem.solvedAt,
      category: "算法题解",
      url: `${identity.url}/problems/${problem.slug}`,
    })),
  ].sort((left, right) => right.date.localeCompare(left.date));
  const items = entries.map((entry) => `
      <item>
        <title>${escapeXml(entry.title)}</title>
        <link>${entry.url}</link>
        <guid isPermaLink="true">${entry.url}</guid>
        <description>${escapeXml(entry.summary)}</description>
        <pubDate>${new Date(`${entry.date}T00:00:00+08:00`).toUTCString()}</pubDate>
        <category>${escapeXml(entry.category)}</category>
      </item>`).join("");

  const xml = `<?xml version="1.0" encoding="UTF-8" ?>
    <rss version="2.0">
      <channel>
        <title>${escapeXml(identity.name)}</title>
        <link>${identity.url}</link>
        <description>${escapeXml(identity.description)}</description>
        <language>${identity.locale}</language>
        <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
        ${items}
      </channel>
    </rss>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, max-age=0, must-revalidate",
    },
  });
}
