import type {
  ArticleSummary,
  DailyExperience,
  DailyExperienceConfig,
  Project,
} from "../domain/content";

type DailySource = {
  now: Date;
  articles: readonly ArticleSummary[];
  projects: readonly Project[];
  tags: readonly string[];
  config: DailyExperienceConfig;
};

function dateParts(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const value = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? "";
  return {
    year: Number(value("year")),
    month: Number(value("month")),
    day: Number(value("day")),
    key: `${value("year")}-${value("month")}-${value("day")}`,
  };
}

function hash(value: string): number {
  let result = 2166136261;
  for (const character of value) {
    result ^= character.codePointAt(0) ?? 0;
    result = Math.imul(result, 16777619);
  }
  return result >>> 0;
}

function pick<T>(items: readonly T[], seed: number, offset = 0): T | null {
  if (!items.length) return null;
  return items[(seed + offset) % items.length] ?? null;
}

export class DailyExperienceService {
  create(source: DailySource): DailyExperience | null {
    if (!source.articles.length) return null;
    const parts = dateParts(source.now, source.config.timeZone);
    const firstDay = Date.UTC(parts.year, 0, 1);
    const currentDay = Date.UTC(parts.year, parts.month - 1, parts.day);
    const dayOfYear = Math.floor((currentDay - firstDay) / 86_400_000) + 1;
    const seed = hash(parts.key);
    const article = pick(source.articles, seed);
    if (!article) return null;
    const project = pick(source.projects, seed, 7);
    const tag = pick(source.tags, seed, 13) ?? article.tags[0] ?? article.category;
    const displayDate = new Intl.DateTimeFormat("zh-CN", {
      timeZone: source.config.timeZone,
      month: "long",
      day: "numeric",
      weekday: "long",
    }).format(source.now);
    const title = source.config.titleTemplate
      .replaceAll("{tag}", tag)
      .replaceAll("{date}", displayDate);
    return {
      dateKey: parts.key,
      displayDate,
      dayOfYear,
      title,
      tag,
      article,
      project,
    };
  }
}
