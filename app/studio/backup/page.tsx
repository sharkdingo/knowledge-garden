import { requireStudioUser } from "../studio-auth";
import { StudioShell } from "../studio-shell";
import { BackupManager } from "./backup-manager";
import { contentServices } from "../../composition/content";

export const dynamic = "force-dynamic";

export default async function BackupPage() {
  const user = await requireStudioUser("/studio/backup");
  const restorePoints = await contentServices.studio.backup.restorePoints();
  return (
    <StudioShell active="backup" user={user}>
      <header className="studio-page-heading">
        <div>
          <p className="eyebrow">RECOVERY CONTROL</p>
          <h1>备份与恢复</h1>
          <p>导出可移植的 JSON 快照；恢复前必须预演、核对数量并输入一次性确认代码。</p>
        </div>
        <a className="button button-primary" href="/api/studio/export" download>
          导出当前快照
        </a>
      </header>
      <BackupManager initialRestorePoints={[...restorePoints]} />
    </StudioShell>
  );
}
