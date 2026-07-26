import { env } from "cloudflare:workers";
import type { StudioAccessRepository } from "../domain/studio";

function configuredEditors(): Set<string> {
  return new Set(
    (env.STUDIO_EDITOR_EMAILS ?? "")
      .split(",")
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean),
  );
}

export class EnvironmentStudioAccessRepository implements StudioAccessRepository {
  isEditor(email: string): Promise<boolean> {
    return Promise.resolve(configuredEditors().has(email.trim().toLowerCase()));
  }
}
