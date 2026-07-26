import type { SiteProfile, SiteProfileRepository } from "../domain/content";

export class SiteService {
  constructor(private readonly repository: SiteProfileRepository) {}

  getProfile(): Promise<SiteProfile> {
    return this.repository.getSiteProfile();
  }
}
