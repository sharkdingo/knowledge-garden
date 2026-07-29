import type { SearchEntry } from "./content";

export interface SearchRepository {
  listSearchEntries(): Promise<readonly SearchEntry[]>;
}

export type RankedSearchEntry = SearchEntry & {
  score: number;
};

function normalize(value: string): string {
  return value.normalize("NFKC").toLocaleLowerCase("zh-CN").trim();
}

export function searchTokens(query: string): string[] {
  return [...new Set(normalize(query).split(/\s+/).filter(Boolean))];
}

export function rankSearchEntries(
  entries: readonly SearchEntry[],
  query: string,
): RankedSearchEntry[] {
  const normalizedQuery = normalize(query);
  const tokens = searchTokens(query);

  if (!normalizedQuery) {
    return entries.map((entry, index) => ({ ...entry, score: entries.length - index }));
  }

  return entries
    .map((entry) => {
      const title = normalize(entry.title);
      const detail = normalize(entry.detail);
      const excerpt = normalize(entry.excerpt);
      const tags = entry.tags.map(normalize);
      const keywords = normalize(entry.keywords);
      const searchable = `${title} ${detail} ${excerpt} ${tags.join(" ")} ${keywords}`;
      if (!tokens.every((token) => searchable.includes(token))) return null;

      let score = 0;
      if (title === normalizedQuery) score += 240;
      else if (title.startsWith(normalizedQuery)) score += 150;
      else if (title.includes(normalizedQuery)) score += 100;
      if (tags.includes(normalizedQuery)) score += 90;
      if (detail.includes(normalizedQuery)) score += 44;
      if (excerpt.includes(normalizedQuery)) score += 24;

      for (const token of tokens) {
        if (title.includes(token)) score += 38;
        if (tags.some((tag) => tag.includes(token))) score += 26;
        if (keywords.includes(token)) score += 10;
      }
      return { ...entry, score };
    })
    .filter((entry): entry is RankedSearchEntry => Boolean(entry))
    .sort((left, right) =>
      right.score - left.score ||
      left.title.localeCompare(right.title, "zh-CN")
    );
}
