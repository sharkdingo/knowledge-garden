import type { StudioAccessRepository } from "../domain/studio";

export class StudioAccessService {
  constructor(private readonly repository: StudioAccessRepository) {}

  canEdit(email: string): Promise<boolean> {
    return this.repository.isEditor(email.trim().toLowerCase());
  }
}
