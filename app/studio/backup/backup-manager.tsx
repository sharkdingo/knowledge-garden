"use client";

import { useState } from "react";
import type {
  StudioExportSnapshot,
  StudioRestorePoint,
  StudioRestorePreview,
} from "../../domain/studio";
import { studioRequest } from "../studio-client";
import { ConfirmationDialog } from "../components/confirmation-dialog";

type RestoreResponse = StudioRestorePreview & { error?: string; restoredRows?: number };

export function BackupManager({
  initialRestorePoints,
}: {
  initialRestorePoints: StudioRestorePoint[];
}) {
  const [snapshot, setSnapshot] = useState<StudioExportSnapshot | null>(null);
  const [fileName, setFileName] = useState("");
  const [preview, setPreview] = useState<StudioRestorePreview | null>(null);
  const [restorePoints, setRestorePoints] = useState(initialRestorePoints);
  const [confirmation, setConfirmation] = useState("");
  const [pendingRestorePoint, setPendingRestorePoint] = useState<StudioRestorePoint | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function requestRestore(mode: "preview" | "apply") {
    if (!snapshot) return;
    setBusy(true);
    setMessage("");
    try {
      const payload = await studioRequest<RestoreResponse>(
        "/api/studio/import",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ mode, snapshot, confirmationCode: confirmation }),
        },
        "无法处理这个备份。",
      );
      if (mode === "preview") {
        setPreview(payload);
        setConfirmation("");
        setMessage("预演完成。请核对数据量，再输入下方确认代码。");
      } else {
        setMessage(`恢复完成，共写入 ${payload.restoredRows ?? preview?.totalRows ?? 0} 条记录。`);
        setPreview(null);
        setSnapshot(null);
        setFileName("");
        setConfirmation("");
        const refreshed = await refreshRestorePoints();
        if (!refreshed) {
          setMessage(`恢复完成，共写入 ${payload.restoredRows ?? preview?.totalRows ?? 0} 条记录；安全点列表暂未刷新，重新打开页面即可查看。`);
        }
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "无法处理这个备份。");
    } finally {
      setBusy(false);
    }
  }

  async function refreshRestorePoints(): Promise<boolean> {
    try {
      const payload = await studioRequest<{ restorePoints?: StudioRestorePoint[] }>(
        "/api/studio/restore-points",
        undefined,
        "无法刷新安全点。",
      );
      if (payload.restorePoints) setRestorePoints(payload.restorePoints);
      return true;
    } catch {
      return false;
    }
  }

  async function chooseFile(file: File | undefined) {
    setMessage("");
    setPreview(null);
    setConfirmation("");
    if (!file) return;
    if (file.size > 10_000_000) {
      setMessage("备份文件不能超过 10 MB。");
      return;
    }
    try {
      const parsed = JSON.parse(await file.text()) as StudioExportSnapshot;
      setSnapshot(parsed);
      setFileName(file.name);
      setMessage("文件已读取，尚未修改任何数据。");
    } catch {
      setSnapshot(null);
      setFileName("");
      setMessage("这不是有效的 JSON 备份文件。");
    }
  }

  async function restoreSavedPoint(point: StudioRestorePoint) {
    setBusy(true);
    setMessage("");
    try {
      const payload = await studioRequest<RestoreResponse>(
        "/api/studio/restore-points",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: point.id }),
        },
        "无法恢复安全点。",
      );
      setMessage(`安全点已恢复，共写入 ${payload.restoredRows ?? 0} 条记录。`);
      const refreshed = await refreshRestorePoints();
      if (!refreshed) {
        setMessage(`安全点已恢复，共写入 ${payload.restoredRows ?? 0} 条记录；安全点列表暂未刷新，重新打开页面即可查看。`);
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "无法恢复安全点。");
    } finally {
      setBusy(false);
      setPendingRestorePoint(null);
    }
  }

  return (
    <>
    <div className="studio-dashboard-grid studio-backup-grid">
      <section className="studio-form-section" aria-labelledby="restore-title">
        <header>
          <div>
            <p className="eyebrow">SAFE RESTORE</p>
            <h2 id="restore-title">从快照恢复</h2>
          </div>
        </header>
        <div className="studio-form-grid">
          <label className="wide">
            <span>选择 JSON 快照</span>
            <input
              type="file"
              accept="application/json,.json"
              disabled={busy}
              onChange={(event) => void chooseFile(event.target.files?.[0])}
            />
            <small>{fileName || "选择后只会读取和校验，不会立即写入。"}</small>
          </label>
          <div className="wide studio-backup-actions">
            <button
              className="button button-primary"
              type="button"
              disabled={busy || !snapshot}
              onClick={() => void requestRestore("preview")}
            >
              {busy ? "校验中…" : "预演恢复"}
            </button>
          </div>
          {preview && (
            <>
              <div className="wide studio-restore-preview">
                <strong>{preview.totalRows} 条记录 · 导出于 {preview.exportedAt}</strong>
                <p>
                  文章 {preview.counts.articles ?? 0} · 题目 {preview.counts.algorithm_problems ?? 0}
                  {" · "}项目 {preview.counts.projects ?? 0} · 分类 {preview.counts.categories ?? 0}
                </p>
                {preview.warnings.map((warning) => <p key={warning}>{warning}</p>)}
              </div>
              <label className="wide">
                <span>输入确认代码：{preview.confirmationCode}</span>
                <input
                  autoComplete="off"
                  value={confirmation}
                  onChange={(event) => setConfirmation(event.target.value)}
                />
                <small>应用前会自动保存当前数据库的安全恢复点。</small>
              </label>
              <div className="wide studio-backup-actions">
                <button
                  className="button"
                  type="button"
                  disabled={busy || confirmation !== preview.confirmationCode}
                  onClick={() => void requestRestore("apply")}
                >
                  确认并恢复
                </button>
              </div>
            </>
          )}
          <p className="wide studio-form-message" role="status" aria-live="polite">{message}</p>
        </div>
      </section>
      <aside className="studio-panel">
        <header><div><p className="eyebrow">GUARDRAILS</p><h2>恢复保护</h2></div></header>
        <div className="studio-backup-notes">
          <p><strong>先预演</strong><br />文件结构、数据表和记录上限必须全部通过。</p>
          <p><strong>显式确认</strong><br />确认代码与文件校验和绑定，文件变化后会失效。</p>
          <p><strong>保留退路</strong><br />写入前自动保存当前快照，失败不会被伪装成成功。</p>
        </div>
        <div className="studio-restore-points">
          <h3>最近安全点</h3>
          {restorePoints.map((point) => (
            <button
              type="button"
              disabled={busy}
              key={point.id}
              onClick={() => setPendingRestorePoint(point)}
            >
              <span>{point.createdAt.replace("T", " ").slice(0, 19)} UTC</span>
              <small>恢复此状态</small>
            </button>
          ))}
          {!restorePoints.length && <p>首次恢复前还没有安全点。</p>}
        </div>
      </aside>
    </div>
    <ConfirmationDialog
      open={Boolean(pendingRestorePoint)}
      title="恢复这个安全点？"
      description={`将恢复到 ${pendingRestorePoint?.createdAt.replace("T", " ").slice(0, 19) ?? ""} UTC。当前数据库会先自动生成新的安全点。`}
      confirmLabel="确认恢复"
      busyLabel="恢复中…"
      busy={busy}
      danger
      onCancel={() => setPendingRestorePoint(null)}
      onConfirm={() => {
        if (pendingRestorePoint) void restoreSavedPoint(pendingRestorePoint);
      }}
    />
    </>
  );
}
