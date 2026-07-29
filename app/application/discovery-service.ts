import type { SearchEntry, TaxonomyRepository } from "../domain/content";
import type { SearchRepository } from "../domain/search";

export class DiscoveryService {
  constructor(
    private readonly taxonomy: TaxonomyRepository,
    private readonly search: SearchRepository,
  ) {}

  async getTaxonomy() {
    const [categories, tags] = await Promise.all([
      this.taxonomy.listCategories(),
      this.taxonomy.listTags(),
    ]);
    return { categories: [...categories], tags: [...tags] };
  }

  async buildSearchIndex(): Promise<SearchEntry[]> {
    return [...await this.search.listSearchEntries()];
  }
}
