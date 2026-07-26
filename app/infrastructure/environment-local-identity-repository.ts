import { env } from "cloudflare:workers";
import type {
  LocalIdentityConfiguration,
  LocalIdentityRepository,
} from "../domain/auth";

export class EnvironmentLocalIdentityRepository
implements LocalIdentityRepository {
  getConfiguration(): LocalIdentityConfiguration {
    return {
      enabled: env.LOCAL_STUDIO_AUTH === "true",
      email: env.LOCAL_STUDIO_USER_EMAIL?.trim() ?? "",
      fullName: env.LOCAL_STUDIO_USER_NAME?.trim() || null,
    };
  }
}
