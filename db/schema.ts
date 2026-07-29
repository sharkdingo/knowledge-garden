import { index, integer, primaryKey, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const siteSettings = sqliteTable("site_settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const navigationItems = sqliteTable("navigation_items", {
  id: text("id").primaryKey(),
  location: text("location").notNull(),
  href: text("href").notNull(),
  label: text("label").notNull(),
  sortOrder: integer("sort_order").notNull(),
}, (table) => [index("navigation_location_order_idx").on(table.location, table.sortOrder)]);

export const categories = sqliteTable("categories", {
  id: text("id").primaryKey(),
  name: text("name").notNull().unique(),
  description: text("description").notNull(),
  sortOrder: integer("sort_order").notNull(),
});

export const articles = sqliteTable("articles", {
  slug: text("slug").primaryKey(),
  title: text("title").notNull(),
  summary: text("summary").notNull(),
  publishedAt: text("published_at").notNull(),
  displayDate: text("display_date").notNull(),
  categoryId: text("category_id").notNull().references(() => categories.id),
  minutes: integer("minutes").notNull(),
  featured: integer("featured", { mode: "boolean" }).notNull().default(false),
  lead: text("lead").notNull(),
  quote: text("quote"),
  calloutLabel: text("callout_label"),
  calloutLines: text("callout_lines"),
  status: text("status").notNull().default("published"),
  rowVersion: integer("row_version").notNull().default(1),
  writeToken: text("write_token"),
}, (table) => [
  index("articles_status_date_idx").on(table.status, table.publishedAt),
  index("articles_category_idx").on(table.categoryId),
]);

export const articleDrafts = sqliteTable("article_drafts", {
  articleSlug: text("article_slug")
    .primaryKey()
    .references(() => articles.slug, { onDelete: "cascade" }),
  payload: text("payload").notNull(),
  savedAt: text("saved_at").notNull(),
});

export const articleRevisions = sqliteTable("article_revisions", {
  id: text("id").primaryKey(),
  articleSlug: text("article_slug").notNull().references(() => articles.slug, { onDelete: "cascade" }),
  payload: text("payload").notNull(),
  reason: text("reason").notNull(),
  createdAt: text("created_at").notNull(),
}, (table) => [
  index("article_revisions_article_created_idx").on(table.articleSlug, table.createdAt),
]);

export const articleReactions = sqliteTable("article_reactions", {
  articleSlug: text("article_slug").notNull().references(() => articles.slug, { onDelete: "cascade" }),
  visitorKey: text("visitor_key").notNull(),
  reactionId: text("reaction_id").notNull(),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
}, (table) => [
  primaryKey({ columns: [table.articleSlug, table.visitorKey] }),
  index("article_reactions_article_reaction_idx").on(table.articleSlug, table.reactionId),
  index("article_reactions_updated_idx").on(table.updatedAt),
]);

export const articleSections = sqliteTable("article_sections", {
  articleSlug: text("article_slug").notNull().references(() => articles.slug, { onDelete: "cascade" }),
  sectionId: text("section_id").notNull(),
  title: text("title").notNull(),
  paragraphs: text("paragraphs").notNull(),
  sortOrder: integer("sort_order").notNull(),
}, (table) => [
  primaryKey({ columns: [table.articleSlug, table.sectionId] }),
  index("article_sections_order_idx").on(table.articleSlug, table.sortOrder),
]);

export const tags = sqliteTable("tags", {
  id: text("id").primaryKey(),
  name: text("name").notNull().unique(),
});

export const articleTags = sqliteTable("article_tags", {
  articleSlug: text("article_slug").notNull().references(() => articles.slug, { onDelete: "cascade" }),
  tagId: text("tag_id").notNull().references(() => tags.id, { onDelete: "cascade" }),
}, (table) => [primaryKey({ columns: [table.articleSlug, table.tagId] })]);

export const algorithmProblems = sqliteTable("algorithm_problems", {
  slug: text("slug").primaryKey(),
  platform: text("platform").notNull(),
  problemId: text("problem_id").notNull(),
  title: text("title").notNull(),
  difficulty: text("difficulty").notNull(),
  sourceUrl: text("source_url").notNull(),
  summary: text("summary").notNull(),
  statement: text("statement").notNull(),
  constraints: text("constraints").notNull(),
  status: text("status").notNull().default("draft"),
  solvedAt: text("solved_at").notNull(),
  updatedAt: text("updated_at").notNull(),
  featured: integer("featured", { mode: "boolean" }).notNull().default(false),
  rowVersion: integer("row_version").notNull().default(1),
  writeToken: text("write_token"),
}, (table) => [
  index("algorithm_problems_status_solved_idx").on(table.status, table.solvedAt),
  index("algorithm_problems_platform_id_idx").on(table.platform, table.problemId),
]);

export const algorithmSolutions = sqliteTable("algorithm_solutions", {
  id: text("id").primaryKey(),
  problemSlug: text("problem_slug").notNull().references(() => algorithmProblems.slug, { onDelete: "cascade" }),
  title: text("title").notNull(),
  intuition: text("intuition").notNull(),
  steps: text("steps").notNull(),
  proof: text("proof").notNull(),
  timeComplexity: text("time_complexity").notNull(),
  spaceComplexity: text("space_complexity").notNull(),
  pitfalls: text("pitfalls").notNull(),
  sortOrder: integer("sort_order").notNull(),
}, (table) => [
  index("algorithm_solutions_problem_order_idx").on(table.problemSlug, table.sortOrder),
]);

export const algorithmCodeBlocks = sqliteTable("algorithm_code_blocks", {
  id: text("id").primaryKey(),
  solutionId: text("solution_id").notNull().references(() => algorithmSolutions.id, { onDelete: "cascade" }),
  language: text("language").notNull(),
  label: text("label").notNull(),
  code: text("code").notNull(),
  sortOrder: integer("sort_order").notNull(),
}, (table) => [
  index("algorithm_code_blocks_solution_order_idx").on(table.solutionId, table.sortOrder),
]);

export const algorithmReferences = sqliteTable("algorithm_references", {
  id: text("id").primaryKey(),
  problemSlug: text("problem_slug").notNull().references(() => algorithmProblems.slug, { onDelete: "cascade" }),
  solutionId: text("solution_id").references(() => algorithmSolutions.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  author: text("author").notNull(),
  url: text("url").notNull(),
  note: text("note").notNull(),
  accessedAt: text("accessed_at").notNull(),
  sortOrder: integer("sort_order").notNull(),
}, (table) => [
  index("algorithm_references_problem_order_idx").on(table.problemSlug, table.sortOrder),
  index("algorithm_references_solution_idx").on(table.solutionId),
]);

export const algorithmProblemTags = sqliteTable("algorithm_problem_tags", {
  problemSlug: text("problem_slug").notNull().references(() => algorithmProblems.slug, { onDelete: "cascade" }),
  tagId: text("tag_id").notNull().references(() => tags.id, { onDelete: "cascade" }),
}, (table) => [primaryKey({ columns: [table.problemSlug, table.tagId] })]);

export const projects = sqliteTable("projects", {
  id: text("id").primaryKey(),
  name: text("name").notNull().unique(),
  subtitle: text("subtitle").notNull(),
  description: text("description").notNull(),
  status: text("status").notNull(),
  statusLabel: text("status_label").notNull(),
  category: text("category").notNull(),
  stack: text("stack").notNull(),
  updatedAt: text("updated_at").notNull(),
  visual: text("visual").notNull(),
  relatedArticleSlug: text("related_article_slug").references(() => articles.slug),
  repositoryUrl: text("repository_url"),
  demoUrl: text("demo_url"),
  sortOrder: integer("sort_order").notNull(),
  archived: integer("archived", { mode: "boolean" }).notNull().default(false),
  rowVersion: integer("row_version").notNull().default(1),
}, (table) => [index("projects_order_idx").on(table.sortOrder)]);

export const studioRestorePoints = sqliteTable("studio_restore_points", {
  id: text("id").primaryKey(),
  payload: text("payload").notNull(),
  createdAt: text("created_at").notNull(),
});
