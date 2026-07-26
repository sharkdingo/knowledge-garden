export type LocalIdentityConfiguration = {
  enabled: boolean;
  email: string;
  fullName: string | null;
};

export interface LocalIdentityRepository {
  getConfiguration(): LocalIdentityConfiguration;
}
