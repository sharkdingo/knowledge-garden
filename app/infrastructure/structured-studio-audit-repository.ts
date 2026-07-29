import type { StudioAuditEvent, StudioAuditRepository } from "../domain/studio";

async function actorHash(email: string): Promise<string> {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(email.trim().toLowerCase()),
  );
  return [...new Uint8Array(digest)]
    .slice(0, 12)
    .map((value) => value.toString(16).padStart(2, "0"))
    .join("");
}

export class StructuredStudioAuditRepository implements StudioAuditRepository {
  async record(actorEmail: string, event: StudioAuditEvent): Promise<void> {
    console.info(JSON.stringify({
      type: "studio_audit",
      actorHash: await actorHash(actorEmail),
      occurredAt: new Date().toISOString(),
      ...event,
    }));
  }
}
