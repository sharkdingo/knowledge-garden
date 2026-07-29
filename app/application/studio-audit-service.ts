import type { StudioAuditEvent, StudioAuditRepository } from "../domain/studio";

export class StudioAuditService {
  constructor(private readonly repository: StudioAuditRepository) {}

  async record(actorEmail: string, event: StudioAuditEvent): Promise<void> {
    try {
      await this.repository.record(actorEmail, event);
    } catch {
      // Audit delivery must never turn a successful content write into a false failure.
      console.error(JSON.stringify({
        type: "studio_audit_delivery_failed",
        action: event.action,
        resourceType: event.resourceType,
        resourceId: event.resourceId,
      }));
    }
  }
}
