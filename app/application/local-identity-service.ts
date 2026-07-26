import type {
  LocalIdentityConfiguration,
  LocalIdentityRepository,
} from "../domain/auth";

export class LocalIdentityService {
  constructor(private readonly repository: LocalIdentityRepository) {}

  forHost(host: string | null): LocalIdentityConfiguration | null {
    const identity = this.repository.getConfiguration();
    if (!identity.enabled || !identity.email || !host) return null;

    let hostname: string;
    try {
      hostname = new URL(`http://${host}`).hostname;
    } catch {
      return null;
    }
    if (!["localhost", "127.0.0.1", "[::1]"].includes(hostname)) return null;
    return identity;
  }
}
