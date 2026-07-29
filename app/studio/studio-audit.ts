import type { ChatGPTUser } from "../chatgpt-auth";
import type { StudioAuditEvent } from "../domain/studio";
import { contentServices } from "../composition/content";

export function recordStudioAudit(
  user: ChatGPTUser,
  event: StudioAuditEvent,
): Promise<void> {
  return contentServices.studio.audit.record(user.email, event);
}
