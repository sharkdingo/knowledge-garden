import { LocalIdentityService } from "../application/local-identity-service";
import { EnvironmentLocalIdentityRepository } from "../infrastructure/environment-local-identity-repository";

export const localIdentityService = new LocalIdentityService(
  new EnvironmentLocalIdentityRepository(),
);
