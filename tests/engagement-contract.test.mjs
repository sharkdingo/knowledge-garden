import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("reader responses cross application and repository boundaries", async () => {
  const [service, route, repository, composition] = await Promise.all([
    readFile("app/application/article-engagement-service.ts", "utf8"),
    readFile("app/api/articles/[slug]/reaction/route.ts", "utf8"),
    readFile("app/infrastructure/d1-engagement-repository.ts", "utf8"),
    readFile("app/composition/content.ts", "utf8"),
  ]);

  assert.match(service, /ArticleEngagementRepository/);
  assert.match(service, /SiteProfileRepository/);
  assert.match(service, /config\.options/);
  assert.match(route, /contentServices\.engagement/);
  assert.doesNotMatch(route, /env\.DB|prepare\(/);
  assert.match(repository, /ON CONFLICT\(article_slug, visitor_key\)/);
  assert.match(repository, /GROUP BY reaction_id/);
  assert.match(composition, /new D1EngagementRepository/);
});

test("visitor response content is profile-driven and has no embedded options", async () => {
  const [component, articlePage, studioRepository] = await Promise.all([
    readFile("app/components/article-engagement.tsx", "utf8"),
    readFile("app/writing/[slug]/page.tsx", "utf8"),
    readFile("app/infrastructure/d1-studio-repository.ts", "utf8"),
  ]);

  assert.match(component, /config\.options\.map/);
  assert.match(component, /config\.totalTemplate/);
  assert.match(component, /config\.privacyNote/);
  assert.doesNotMatch(component, /值得慢想|更清楚了|想继续聊|我要试试/);
  assert.match(articlePage, /profile\.engagement/);
  assert.match(studioRepository, /engagement: profile\.engagement/);
  assert.match(studioRepository, /DELETE FROM article_reactions/);
  assert.doesNotMatch(studioRepository, /KNOWLEDGE GARDEN \/ INITIALIZING|正在连接知识节点|跳过开场/);
});

test("Studio exposes editable reader response configuration", async () => {
  const [editor, service, studioPage] = await Promise.all([
    readFile("app/studio/site/site-editor.tsx", "utf8"),
    readFile("app/application/studio-site-service.ts", "utf8"),
    readFile("app/studio/page.tsx", "utf8"),
  ]);

  assert.match(editor, /settings\.engagement\.options\.map/);
  assert.match(editor, /addReactionOption/);
  assert.match(service, /reactionIds/);
  assert.match(service, /settings\.engagement\.options\.length < 2/);
  assert.match(studioPage, /contentServices\.engagement\.getOverview/);
});
