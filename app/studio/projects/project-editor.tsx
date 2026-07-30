"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type {
  StudioArticleSummary,
  StudioProject,
  StudioProjectInput,
} from "../../domain/studio";
import { isScheduledArticleLive } from "../../domain/studio";
import { ProjectVisual } from "../../components/project-visual";
import { studioRequest } from "../studio-client";
import { ConfirmationDialog } from "../components/confirmation-dialog";

type EditorState = {
  id: string;
  name: string;
  subtitle: string;
  description: string;
  status: string;
  statusLabel: string;
  category: string;
  stack: string;
  updated: string;
  visual: StudioProject["visual"];
  relatedArticleSlug: string;
  repositoryUrl: string;
  demoUrl: string;
  sortOrder: number;
  archived: boolean;
};

function initialState(project: StudioProject | null): EditorState {
  if (project) {
    return {
      id: project.id,
      name: project.name,
      subtitle: project.subtitle,
      description: project.description,
      status: project.status,
      statusLabel: project.statusLabel,
      category: project.category,
      stack: project.stack.join(", "),
      updated: project.updated,
      visual: project.visual,
      relatedArticleSlug: project.relatedArticleSlug ?? "",
      repositoryUrl: project.links?.repository ?? "",
      demoUrl: project.links?.demo ?? "",
      sortOrder: project.sortOrder,
      archived: project.archived,
    };
  }
  return {
    id: "",
    name: "",
    subtitle: "",
    description: "",
    status: "building",
    statusLabel: "持续构建",
    category: "",
    stack: "",
    updated: new Date().toISOString().slice(0, 10).replaceAll("-", "."),
    visual: "canvas",
    relatedArticleSlug: "",
    repositoryUrl: "",
    demoUrl: "",
    sortOrder: 100,
    archived: false,
  };
}

function toInput(state: EditorState): StudioProjectInput {
  return {
    ...state,
    stack: state.stack.split(/[,，]/).map((item) => item.trim()).filter(Boolean),
    relatedArticleSlug: state.relatedArticleSlug || undefined,
    repositoryUrl: state.repositoryUrl || undefined,
    demoUrl: state.demoUrl || undefined,
  };
}

export function ProjectEditor({
  project,
  articles,
}: {
  project: StudioProject | null;
  articles: StudioArticleSummary[];
}) {
  const router = useRouter();
  const [state, setState] = useState(() => initialState(project));
  const [version, setVersion] = useState(project?.version ?? 0);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [preview, setPreview] = useState(false);
  const [archiveOpen, setArchiveOpen] = useState(false);
  const isNew = project === null;

  useEffect(() => {
    const preventLoss = (event: BeforeUnloadEvent) => {
      if (!dirty) return;
      event.preventDefault();
    };
    window.addEventListener("beforeunload", preventLoss);
    return () => window.removeEventListener("beforeunload", preventLoss);
  }, [dirty]);

  function patch<K extends keyof EditorState>(key: K, value: EditorState[K]) {
    setState((current) => ({ ...current, [key]: value }));
    setDirty(true);
    setMessage("");
  }

  async function save(event?: React.FormEvent, archived = state.archived) {
    event?.preventDefault();
    setSaving(true);
    setMessage("");
    try {
      const input = { ...toInput(state), archived };
      const result = await studioRequest<{
        id?: string;
        version?: number;
      }>(
        isNew ? "/api/studio/projects" : `/api/studio/projects/${project.id}`,
        {
          method: isNew ? "POST" : "PUT",
          headers: {
            "Content-Type": "application/json",
            ...(!isNew ? { "If-Match": String(version) } : {}),
          },
          body: JSON.stringify(input),
        },
        "保存项目失败，请稍后重试。",
      );
      if (result.version) setVersion(result.version);
      setState((current) => ({ ...current, archived }));
      setDirty(false);
      setMessage(archived ? "项目已归档，可随时恢复。" : "项目更改已经保存。");
      if (isNew && result.id) router.replace(`/studio/projects/${result.id}`);
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "保存失败，请稍后重试。");
    } finally {
      setSaving(false);
    }
  }

  async function archive() {
    if (!project) return;
    setSaving(true);
    setMessage("");
    try {
      await studioRequest(
        `/api/studio/projects/${project.id}`,
        {
          method: "DELETE",
          headers: { "If-Match": String(version) },
        },
        "归档项目失败。",
      );
      setDirty(false);
      router.push("/studio/projects");
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "归档失败。");
      setArchiveOpen(false);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="studio-editor" aria-busy={saving} onSubmit={save}>
      <div className="studio-editor-toolbar">
        <div>
          <span className={dirty ? "dirty" : ""} aria-hidden="true" />
          <p>{dirty ? "有未保存更改" : "全部更改已保存"}</p>
        </div>
        <div className="studio-view-toggle" role="group" aria-label="项目编辑视图">
          <button type="button" className={!preview ? "active" : ""} aria-pressed={!preview} onClick={() => setPreview(false)}>编辑</button>
          <button type="button" className={preview ? "active" : ""} aria-pressed={preview} onClick={() => setPreview(true)}>预览</button>
        </div>
        {state.archived && !isNew && (
          <button className="button button-secondary" type="button" disabled={saving} onClick={() => void save(undefined, false)}>
            恢复项目
          </button>
        )}
        <button className="button button-primary" type="submit" disabled={saving || !dirty}>
          {saving ? "保存中…" : "保存项目"}
        </button>
      </div>

      <p className="studio-form-message" role="status" aria-live="polite">{message}</p>

      <fieldset className="studio-editor-fields" disabled={saving}>
      {preview ? (
        <section className="studio-live-preview" aria-label="项目卡片预览">
          <p className="eyebrow">LIVE PREVIEW</p>
          <article className={`project-card status-${state.status.toLowerCase()}`}>
            <ProjectVisual type={state.visual} />
            <p className="project-status">{state.status.toUpperCase()} · {state.statusLabel}</p>
            <h2>{state.name || "未命名项目"}</h2>
            <h3>{state.subtitle || "项目副标题会显示在这里"}</h3>
            <div className="stack-list">
              {toInput(state).stack.map((item) => <span key={item}>{item}</span>)}
            </div>
            <p>{state.description || "项目说明会显示在这里。"}</p>
            <footer><small>UPDATED {state.updated}</small></footer>
          </article>
        </section>
      ) : (
        <section className="studio-form-section" aria-labelledby="project-basic-title">
          <header><p className="eyebrow">PROJECT</p><h2 id="project-basic-title">项目资料</h2></header>
          <div className="studio-form-grid">
            <label><span>项目名称</span><input required maxLength={120} value={state.name} onChange={(event) => patch("name", event.target.value)} /></label>
            <label><span>项目 ID</span><input required disabled={!isNew} pattern="[a-z0-9]+(?:-[a-z0-9]+)*" value={state.id} onChange={(event) => patch("id", event.target.value.toLowerCase())} /></label>
            <label className="wide"><span>副标题</span><input required maxLength={160} value={state.subtitle} onChange={(event) => patch("subtitle", event.target.value)} /></label>
            <label><span>状态代码</span><input required maxLength={40} value={state.status} onChange={(event) => patch("status", event.target.value)} placeholder="building" /></label>
            <label><span>状态说明</span><input required maxLength={80} value={state.statusLabel} onChange={(event) => patch("statusLabel", event.target.value)} placeholder="持续构建" /></label>
            <label><span>分类</span><input required maxLength={80} value={state.category} onChange={(event) => patch("category", event.target.value)} /></label>
            <label><span>卡片视觉</span><select value={state.visual} onChange={(event) => patch("visual", event.target.value as EditorState["visual"])}><option value="canvas">Canvas</option><option value="agent">Agent</option><option value="iot">IoT</option></select></label>
            <label><span>更新时间</span><input required value={state.updated} onChange={(event) => patch("updated", event.target.value)} placeholder="2026.07.23" /></label>
            <label><span>排序</span><input type="number" min={0} max={9999} required value={state.sortOrder} onChange={(event) => patch("sortOrder", Number(event.target.value))} /></label>
            <label className="wide"><span>技术栈</span><input required value={state.stack} onChange={(event) => patch("stack", event.target.value)} placeholder="TypeScript, Cloudflare, D1" /><small>使用逗号分隔。</small></label>
            <label className="wide"><span>项目说明</span><textarea required maxLength={800} rows={5} value={state.description} onChange={(event) => patch("description", event.target.value)} /></label>
            <label><span>关联文章</span><select value={state.relatedArticleSlug} onChange={(event) => patch("relatedArticleSlug", event.target.value)}><option value="">不关联</option>{articles.map((article) => <option key={article.slug} value={article.slug}>{article.title || "未命名草稿"} · {article.status === "published" ? "已发布" : article.status === "scheduled" ? isScheduledArticleLive(article.status, article.publishedAt) ? "定时已生效" : "定时发布" : article.status === "draft" ? "草稿" : "已归档"}</option>)}</select><small>只有已经对访客可见的文章才会显示“设计笔记”入口。</small></label>
            <label><span>代码仓库 URL</span><input type="url" value={state.repositoryUrl} onChange={(event) => patch("repositoryUrl", event.target.value)} /></label>
            <label className="wide"><span>演示 URL</span><input type="url" value={state.demoUrl} onChange={(event) => patch("demoUrl", event.target.value)} /></label>
          </div>
        </section>
      )}

      {!isNew && !state.archived && (
        <section className="studio-danger-zone" aria-labelledby="project-archive-title">
          <div><h2 id="project-archive-title">归档项目</h2><p>项目会从访客页面隐藏，但资料会保留并可随时恢复。</p></div>
          <button type="button" onClick={() => setArchiveOpen(true)}>归档项目</button>
        </section>
      )}
      </fieldset>

      <ConfirmationDialog
        open={archiveOpen}
        title="确认归档这个项目？"
        description={`“${project?.name ?? ""}”会从访客页面隐藏，之后仍可在工作室恢复。`}
        confirmLabel="确认归档"
        busyLabel="归档中…"
        busy={saving}
        danger
        onCancel={() => setArchiveOpen(false)}
        onConfirm={() => void archive()}
      />
    </form>
  );
}
