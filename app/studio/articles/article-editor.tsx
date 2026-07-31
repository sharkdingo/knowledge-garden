"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type {
  StudioArticle,
  StudioArticleDraft,
  StudioArticleInput,
  StudioArticleRevision,
  StudioCategory,
} from "../../domain/studio";
import { studioRequest } from "../studio-client";
import { isScheduledArticleLive } from "../../domain/studio";
import { ConfirmationDialog } from "../components/confirmation-dialog";
import { useStudioUnsavedChanges } from "../components/unsaved-changes";

type EditorSection = { id: string; title: string; body: string };
type ArticleStatus = StudioArticle["status"];
type EditorState = {
  slug: string;
  title: string;
  summary: string;
  publishedAt: string;
  displayDate: string;
  categoryId: string;
  minutes: number;
  featured: boolean;
  lead: string;
  quote: string;
  calloutLabel: string;
  calloutLines: string;
  status: ArticleStatus;
  tags: string;
  sections: EditorSection[];
};
type Confirmation = "publish" | "publish-now" | "unpublish" | "archive" | "restore" | null;
type AutosaveStatus = "idle" | "pending" | "saving" | "saved" | "failed";
type RecoveryCandidate = {
  source: "browser" | "cloud";
  state: EditorState;
  savedAt?: string;
};

function today() {
  const now = new Date();
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 10);
}

function initialState(article: StudioArticle | null, categories: StudioCategory[]): EditorState {
  if (article) {
    return {
      slug: article.slug,
      title: article.title,
      summary: article.summary,
      publishedAt: article.publishedAt.slice(0, 10),
      displayDate: article.displayDate,
      categoryId: article.categoryId,
      minutes: article.minutes,
      featured: article.featured,
      lead: article.lead,
      quote: article.quote,
      calloutLabel: article.calloutLabel,
      calloutLines: article.calloutLines.join("\n"),
      status: article.status,
      tags: article.tags.join(", "),
      sections: article.sections.map((section) => ({
        id: section.id,
        title: section.title,
        body: section.paragraphs.join("\n\n"),
      })),
    };
  }
  const date = today();
  return {
    slug: "",
    title: "",
    summary: "",
    publishedAt: date,
    displayDate: date.replaceAll("-", "."),
    categoryId: categories[0]?.id ?? "",
    minutes: 5,
    featured: false,
    lead: "",
    quote: "",
    calloutLabel: "",
    calloutLines: "",
    status: "draft",
    tags: "",
    sections: [{ id: "start", title: "从这里开始", body: "" }],
  };
}

function stateFromInput(input: StudioArticleInput): EditorState {
  return {
    slug: input.slug,
    title: input.title,
    summary: input.summary,
    publishedAt: input.publishedAt.slice(0, 10),
    displayDate: input.displayDate,
    categoryId: input.categoryId,
    minutes: input.minutes,
    featured: input.featured,
    lead: input.lead,
    quote: input.quote,
    calloutLabel: input.calloutLabel,
    calloutLines: input.calloutLines.join("\n"),
    status: input.status,
    tags: input.tags.join(", "),
    sections: input.sections.map((section) => ({
      id: section.id,
      title: section.title,
      body: section.paragraphs.join("\n\n"),
    })),
  };
}

function toInput(state: EditorState, status = state.status): StudioArticleInput {
  return {
    slug: state.slug,
    title: state.title,
    summary: state.summary,
    publishedAt: `${state.publishedAt}T00:00:00Z`,
    displayDate: state.displayDate,
    categoryId: state.categoryId,
    minutes: Number(state.minutes),
    featured: state.featured,
    lead: state.lead,
    quote: state.quote,
    calloutLabel: state.calloutLabel,
    calloutLines: state.calloutLines.split("\n").map((line) => line.trim()).filter(Boolean),
    status,
    tags: state.tags.split(/[,，]/).map((tag) => tag.trim()).filter(Boolean),
    sections: state.sections.map((section) => ({
      id: section.id,
      title: section.title,
      paragraphs: section.body.split(/\n\s*\n/).map((line) => line.trim()).filter(Boolean),
    })),
  };
}

function isDraftPersistable(state: EditorState): boolean {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(state.slug)
    && Boolean(state.categoryId && state.publishedAt)
    && state.minutes >= 1
    && state.minutes <= 240
    && state.sections.length > 0
    && state.sections.every((section) =>
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(section.id)
    );
}

function isPublishable(state: EditorState): boolean {
  return isDraftPersistable(state)
    && Boolean(state.title.trim() && state.summary.trim())
    && Boolean(state.displayDate.trim() && state.lead.trim())
    && state.sections.every((section) => Boolean(section.title.trim() && section.body.trim()));
}

function nextSectionId(sections: readonly EditorSection[]): string {
  const used = new Set(sections.map((section) => section.id));
  let index = sections.length + 1;
  while (used.has(`section-${index}`)) index += 1;
  return `section-${index}`;
}

const CONFIRMATION_COPY = {
  publish: {
    title: "确认发布这篇文章？",
    description: "保存后文章会立即出现在访客页面、搜索与知识星图中。",
    confirmLabel: "确认发布",
    busyLabel: "发布中…",
  },
  "publish-now": {
    title: "确认立即发布？",
    description: "文章会跳过原定日期，立即出现在访客页面、搜索与知识星图中。",
    confirmLabel: "立即发布",
    busyLabel: "发布中…",
  },
  unpublish: {
    title: "确认转为草稿？",
    description: "文章会立即从访客页面隐藏，但内容和永久链接都会保留。",
    confirmLabel: "转为草稿",
    busyLabel: "处理中…",
  },
  archive: {
    title: "确认归档这篇文章？",
    description: "文章会从访客页面隐藏，内容仍会保留，可随时恢复为草稿。",
    confirmLabel: "确认归档",
    busyLabel: "归档中…",
  },
  restore: {
    title: "恢复这个历史版本？",
    description: "当前版本仍保留在历史中；恢复后可以继续编辑或再次发布。",
    confirmLabel: "恢复版本",
    busyLabel: "恢复中…",
  },
} as const;

const REVISION_LABEL = {
  baseline: "初始版本",
  created: "创建",
  saved: "保存",
  scheduled: "定时",
  published: "发布",
  unpublished: "转为草稿",
  archived: "归档",
  restored: "恢复",
} as const;

export function ArticleEditor({
  article,
  categories,
  serverDraft,
  revisions,
}: {
  article: StudioArticle | null;
  categories: StudioCategory[];
  serverDraft: StudioArticleDraft | null;
  revisions: StudioArticleRevision[];
}) {
  const router = useRouter();
  const [state, setState] = useState(() => initialState(article, categories));
  const [version, setVersion] = useState(article?.version ?? 0);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [message, setMessage] = useState("");
  const [view, setView] = useState<"edit" | "preview">("edit");
  const [confirmation, setConfirmation] = useState<Confirmation>(null);
  const [recovery, setRecovery] = useState<RecoveryCandidate | null>(() => {
    if (!serverDraft) return null;
    const recovered = stateFromInput(serverDraft.input);
    return JSON.stringify(recovered) === JSON.stringify(initialState(article, categories))
      ? null
      : { source: "cloud", state: recovered, savedAt: serverDraft.savedAt };
  });
  const [autosaveStatus, setAutosaveStatus] = useState<AutosaveStatus>("idle");
  const [selectedRevision, setSelectedRevision] = useState<StudioArticleRevision | null>(null);
  const isNew = article === null;
  const recoveryKey = `studio:article-recovery:${article?.slug ?? "new"}`;
  const categoryName = categories.find((category) => category.id === state.categoryId)?.name ?? "";
  const previewInput = useMemo(() => toInput(state), [state]);
  const publishStatus: ArticleStatus = state.publishedAt > today() ? "scheduled" : "published";
  const scheduledIsLive = isScheduledArticleLive(
    state.status,
    `${state.publishedAt}T00:00:00Z`,
  );
  const isPublic = state.status === "published" || scheduledIsLive;

  useStudioUnsavedChanges(dirty);

  useEffect(() => {
    let recoveryTimer: number | undefined;
    try {
      const value = window.localStorage.getItem(recoveryKey);
      if (!value) return;
      const parsed = JSON.parse(value) as { state?: EditorState; savedAt?: string };
      if (parsed.state && JSON.stringify(parsed.state) !== JSON.stringify(state)) {
        recoveryTimer = window.setTimeout(() => setRecovery((current) => {
          if (
            current?.savedAt &&
            parsed.savedAt &&
            Date.parse(current.savedAt) >= Date.parse(parsed.savedAt)
          ) return current;
          return {
            source: "browser",
            state: parsed.state as EditorState,
            savedAt: parsed.savedAt,
          };
        }), 0);
      }
    } catch {
      window.localStorage.removeItem(recoveryKey);
    }
    return () => window.clearTimeout(recoveryTimer);
    // Recovery is deliberately checked once for this article.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recoveryKey]);

  useEffect(() => {
    if (!dirty) return;
    const timer = window.setTimeout(() => {
      window.localStorage.setItem(
        recoveryKey,
        JSON.stringify({ savedAt: new Date().toISOString(), state }),
      );
    }, 650);
    return () => window.clearTimeout(timer);
  }, [dirty, recoveryKey, state]);

  useEffect(() => {
    if (!article || !dirty || saving || !isDraftPersistable(state)) return;
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setAutosaveStatus("saving");
      try {
        await studioRequest(
          `/api/studio/articles/${article.slug}/draft`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(toInput(state)),
            signal: controller.signal,
          },
          "自动备份失败。",
        );
        setAutosaveStatus("saved");
      } catch (error) {
        if ((error as Error).name !== "AbortError") setAutosaveStatus("failed");
      }
    }, 1400);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [article, dirty, saving, state]);

  function patch<K extends keyof EditorState>(key: K, value: EditorState[K]) {
    setState((current) => ({ ...current, [key]: value }));
    setDirty(true);
    setAutosaveStatus("pending");
    setMessage("");
  }

  function patchSection(index: number, key: keyof EditorSection, value: string) {
    setState((current) => ({
      ...current,
      sections: current.sections.map((section, sectionIndex) =>
        sectionIndex === index ? { ...section, [key]: value } : section
      ),
    }));
    setDirty(true);
    setAutosaveStatus("pending");
    setMessage("");
  }

  async function save(status = state.status) {
    const publishing = status === "published" || status === "scheduled";
    if ((publishing && !isPublishable(state)) || (!publishing && !isDraftPersistable(state))) {
      setView("edit");
      setMessage(
        publishing
          ? "发布前请补全标题、摘要、导语和正文，并检查 Slug 与章节锚点。"
          : "保存草稿前请填写有效 Slug，并检查分类、日期和章节锚点。",
      );
      return;
    }
    const form = document.querySelector<HTMLFormElement>(".studio-editor");
    if (publishing && !form?.reportValidity()) {
      setView("edit");
      setMessage("请先补全标记出的必填内容。");
      return;
    }
    setSaving(true);
    setMessage("");
    try {
      const result = await studioRequest<{
        slug?: string;
        version?: number;
      }>(
        isNew ? "/api/studio/articles" : `/api/studio/articles/${article.slug}`,
        {
          method: isNew ? "POST" : "PUT",
          headers: {
            "Content-Type": "application/json",
            ...(!isNew ? { "If-Match": String(version) } : {}),
          },
          body: JSON.stringify(toInput(state, status)),
        },
        "保存文章失败，请稍后重试。",
      );
      if (result.version) setVersion(result.version);
      setState((current) => ({ ...current, status }));
      setDirty(false);
      setAutosaveStatus("idle");
      window.localStorage.removeItem(recoveryKey);
      setRecovery(null);
      setMessage(
        status === "published"
          ? "文章已发布。"
          : status === "scheduled" ? `文章已安排在 ${state.publishedAt} 发布。`
          : status === "archived" ? "文章已归档。" : isNew ? "草稿已经创建。" : "更改已经保存。",
      );
      if (isNew && result.slug) router.replace(`/studio/articles/${result.slug}`);
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "保存失败，请稍后重试。");
    } finally {
      setSaving(false);
      setConfirmation(null);
    }
  }

  async function discardRecovery() {
    try {
      if (recovery?.source === "cloud" && article) {
        await studioRequest(
          `/api/studio/articles/${article.slug}/draft`,
          { method: "DELETE" },
          "无法移除云端备份，请稍后重试。",
        );
      } else {
        window.localStorage.removeItem(recoveryKey);
      }
      setRecovery(null);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "无法移除自动备份。");
    }
  }

  async function restoreRevision() {
    if (!article || !selectedRevision) return;
    setSaving(true);
    setMessage("");
    try {
      const result = await studioRequest<{ article?: StudioArticle }>(
        `/api/studio/articles/${article.slug}/revisions`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "If-Match": String(version),
          },
          body: JSON.stringify({ revisionId: selectedRevision.id }),
        },
        "无法恢复文章版本。",
      );
      if (!result.article) throw new Error("恢复结果不完整，请刷新页面后重试。");
      setState(initialState(result.article, categories));
      setVersion(result.article.version);
      setDirty(false);
      setAutosaveStatus("idle");
      setRecovery(null);
      window.localStorage.removeItem(recoveryKey);
      setMessage("历史版本已恢复，恢复前的内容仍保留在版本记录中。");
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "无法恢复文章版本。");
    } finally {
      setSaving(false);
      setSelectedRevision(null);
      setConfirmation(null);
    }
  }

  async function archive() {
    if (!article) return;
    setSaving(true);
    setMessage("");
    try {
      await studioRequest(
        `/api/studio/articles/${article.slug}`,
        {
          method: "DELETE",
          headers: { "If-Match": String(version) },
        },
        "归档文章失败。",
      );
      setDirty(false);
      window.localStorage.removeItem(recoveryKey);
      router.push("/studio/articles");
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "归档失败。");
      setConfirmation(null);
    } finally {
      setSaving(false);
    }
  }

  function confirmAction() {
    if (confirmation === "publish") void save(publishStatus);
    if (confirmation === "publish-now") void save("published");
    if (confirmation === "unpublish") void save("draft");
    if (confirmation === "archive") void archive();
    if (confirmation === "restore") void restoreRevision();
  }

  const confirmationCopy = confirmation
    ? confirmation === "publish" && publishStatus === "scheduled"
      ? {
          title: "确认定时发布？",
          description: `文章会在 ${state.publishedAt} 自动对访客可见；此前保持隐藏。`,
          confirmLabel: "确认定时",
          busyLabel: "安排中…",
        }
      : confirmation === "publish-now" && scheduledIsLive
        ? {
            title: "确认定时发布已生效？",
            description: "文章已经对访客可见；确认后只会把状态固定为“已发布”。",
            confirmLabel: "确认为已发布",
            busyLabel: "确认中…",
          }
      : CONFIRMATION_COPY[confirmation]
    : null;
  const saveStateLabel = !dirty
    ? "全部更改已保存"
    : autosaveStatus === "saving"
      ? "正在自动备份…"
      : autosaveStatus === "saved"
        ? "已自动备份 · 尚未提交"
        : autosaveStatus === "failed"
          ? "自动备份失败 · 内容仍在本机"
          : "有未保存更改";

  return (
    <form
      className="studio-editor"
      noValidate
      aria-busy={saving}
      onSubmit={(event) => { event.preventDefault(); void save(); }}
    >
      <div className="studio-editor-toolbar">
        <div>
          <span className={dirty ? "dirty" : ""} aria-hidden="true" />
          <p aria-live="polite">{saveStateLabel}</p>
        </div>
        <div className="studio-view-toggle" role="group" aria-label="文章编辑视图">
          <button type="button" className={view === "edit" ? "active" : ""} aria-pressed={view === "edit"} onClick={() => setView("edit")}>编辑</button>
          <button type="button" className={view === "preview" ? "active" : ""} aria-pressed={view === "preview"} onClick={() => setView("preview")}>预览</button>
        </div>
        {!isNew && isPublic && (
          <Link
            className="studio-public-link"
            href={`/writing/${state.slug}`}
            target="_blank"
            rel="noreferrer"
          >
            查看公开文章 <span aria-hidden="true">↗</span>
          </Link>
        )}
        {state.status === "published" ? (
          <>
            <button className="button button-secondary" type="button" disabled={saving} onClick={() => setConfirmation("unpublish")}>转为草稿</button>
            <button className="button button-primary" type="submit" disabled={saving || !dirty}>{saving ? "保存中…" : "保存更新"}</button>
          </>
        ) : state.status === "scheduled" ? (
          <>
            <button className="button button-secondary" type="button" disabled={saving} onClick={() => setConfirmation("unpublish")}>取消定时</button>
            <button className="button button-secondary" type="submit" disabled={saving || !dirty}>{saving ? "保存中…" : "保存定时内容"}</button>
            <button className="button button-primary" type="button" disabled={saving} onClick={() => setConfirmation("publish-now")}>{scheduledIsLive ? "确认为已发布" : "立即发布"}</button>
          </>
        ) : state.status === "archived" ? (
          <button className="button button-primary" type="button" disabled={saving} onClick={() => void save("draft")}>恢复为草稿</button>
        ) : (
          <>
            <button className="button button-secondary" type="submit" disabled={saving || !dirty}>{saving ? "保存中…" : "保存草稿"}</button>
            <button className="button button-primary" type="button" disabled={saving} onClick={() => setConfirmation("publish")}>发布文章</button>
          </>
        )}
      </div>

      <p className="studio-form-message" role="status" aria-live="polite">{message}</p>

      <fieldset className="studio-editor-fields" disabled={saving}>
      {recovery && (
        <aside className="studio-recovery" aria-label="未保存内容恢复">
          <div>
            <strong>发现一份{recovery.source === "cloud" ? "云端" : "浏览器"}自动备份</strong>
            <p>
              {recovery.savedAt
                ? `${new Intl.DateTimeFormat("zh-CN", { dateStyle: "medium", timeStyle: "short" }).format(new Date(recovery.savedAt))} 保存。`
                : "可能来自上次异常关闭。"}
              恢复前不会覆盖当前正式版本。
            </p>
          </div>
          <div>
            <button type="button" onClick={() => {
              setState(recovery.state);
              setRecovery(null);
              setDirty(true);
              setAutosaveStatus("saved");
              setMessage("已恢复自动备份，请检查后提交更改。");
            }}>恢复内容</button>
            <button type="button" onClick={() => void discardRecovery()}>忽略</button>
          </div>
        </aside>
      )}

      {view === "preview" ? (
        <article className="studio-live-preview studio-article-preview" aria-label="文章预览">
          <header>
            <p className="eyebrow">{categoryName || "未分类"} / {state.minutes} MIN</p>
            <h1>{state.title || "未命名文章"}</h1>
            <p>{state.summary || "摘要会显示在这里。"}</p>
            <small>{state.displayDate}</small>
          </header>
          <p className="article-lead">{state.lead || "导语会显示在这里。"}</p>
          {state.quote && <blockquote>{state.quote}</blockquote>}
          {previewInput.sections.map((section) => (
            <section key={section.id}>
              <h2>{section.title || "未命名章节"}</h2>
              {section.paragraphs.map((paragraph, index) => <p key={`${section.id}-${index}`}>{paragraph}</p>)}
            </section>
          ))}
          {state.calloutLabel && (
            <aside><strong>{state.calloutLabel}</strong>{previewInput.calloutLines.map((line) => <p key={line}>{line}</p>)}</aside>
          )}
          <footer>{previewInput.tags.map((tag) => <span key={tag}>#{tag}</span>)}</footer>
        </article>
      ) : (
        <>
          <section className="studio-form-section" aria-labelledby="article-basic-title">
            <header><p className="eyebrow">BASIC</p><h2 id="article-basic-title">基本信息</h2></header>
            <div className="studio-form-grid">
              <label className="wide"><span>文章标题</span><input required maxLength={160} value={state.title} onChange={(event) => patch("title", event.target.value)} /></label>
              <label><span>Slug</span><input required pattern="[a-z0-9]+(?:-[a-z0-9]+)*" disabled={!isNew} value={state.slug} onChange={(event) => patch("slug", event.target.value.toLowerCase())} aria-describedby="slug-help" /><small id="slug-help">{isNew ? "小写字母、数字与连字符；创建后不可修改。" : "永久链接已锁定，避免旧链接失效。"}</small></label>
              <label><span>分类</span><select value={state.categoryId} onChange={(event) => patch("categoryId", event.target.value)}>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label>
              <label><span>发布日期</span><input type="date" required value={state.publishedAt} onChange={(event) => patch("publishedAt", event.target.value)} /></label>
              <label><span>页面显示日期</span><input required maxLength={40} value={state.displayDate} onChange={(event) => patch("displayDate", event.target.value)} /></label>
              <label><span>预计阅读时间</span><span className="input-with-suffix"><input type="number" min={1} max={240} required value={state.minutes} onChange={(event) => patch("minutes", Number(event.target.value))} /><i>分钟</i></span></label>
              <label><span>标签</span><input value={state.tags} onChange={(event) => patch("tags", event.target.value)} placeholder="架构, AI, 工程实践" /></label>
              <label className="wide"><span>摘要</span><textarea required maxLength={320} rows={3} value={state.summary} onChange={(event) => patch("summary", event.target.value)} /></label>
              <label className="wide"><span>导语</span><textarea required maxLength={600} rows={4} value={state.lead} onChange={(event) => patch("lead", event.target.value)} /></label>
              <label className="studio-check wide"><input type="checkbox" checked={state.featured} onChange={(event) => patch("featured", event.target.checked)} /><span>标记为推荐文章（用于列表强调）</span></label>
            </div>
          </section>

          <section className="studio-form-section" aria-labelledby="article-body-title">
            <header>
              <div><p className="eyebrow">BODY</p><h2 id="article-body-title">正文结构</h2></div>
              <button
                className="button button-secondary"
                type="button"
                onClick={() => patch("sections", [
                  ...state.sections,
                  { id: nextSectionId(state.sections), title: "", body: "" },
                ])}
              >
                添加章节
              </button>
            </header>
            <div className="studio-section-stack">
              {state.sections.map((section, index) => (
                <fieldset key={`${index}-${section.id}`}>
                  <legend>章节 {String(index + 1).padStart(2, "0")}</legend>
                  <label><span>章节标题</span><input required value={section.title} onChange={(event) => patchSection(index, "title", event.target.value)} /></label>
                  <label><span>锚点</span><input required pattern="[a-z0-9]+(?:-[a-z0-9]+)*" value={section.id} onChange={(event) => patchSection(index, "id", event.target.value.toLowerCase())} /></label>
                  <label className="wide"><span>正文段落</span><textarea required rows={8} value={section.body} onChange={(event) => patchSection(index, "body", event.target.value)} aria-describedby={`section-${index}-help`} /><small id={`section-${index}-help`}>使用一个空行分隔段落。</small></label>
                  {state.sections.length > 1 && <button className="studio-text-danger" type="button" onClick={() => patch("sections", state.sections.filter((_, sectionIndex) => sectionIndex !== index))}>移除此章节</button>}
                </fieldset>
              ))}
            </div>
          </section>

          <details className="studio-advanced">
            <summary>引用与提示框</summary>
            <div className="studio-form-grid">
              <label className="wide"><span>文章引用</span><textarea rows={3} value={state.quote} onChange={(event) => patch("quote", event.target.value)} /></label>
              <label><span>提示框标题</span><input value={state.calloutLabel} onChange={(event) => patch("calloutLabel", event.target.value)} /></label>
              <label><span>提示框内容</span><textarea rows={4} value={state.calloutLines} onChange={(event) => patch("calloutLines", event.target.value)} /><small>每行一项。</small></label>
            </div>
          </details>

          {!isNew && (
            <details className="studio-history">
              <summary>
                <span><strong>版本历史</strong><small>最近 {revisions.length} 个已提交版本</small></span>
                <b aria-hidden="true">＋</b>
              </summary>
              <div>
                {revisions.length ? revisions.map((revision, index) => (
                  <article key={revision.id}>
                    <span>
                      <strong>{REVISION_LABEL[revision.reason]} · {revision.title || "未命名草稿"}</strong>
                      <small>
                        {new Intl.DateTimeFormat("zh-CN", {
                          dateStyle: "medium",
                          timeStyle: "short",
                        }).format(new Date(revision.createdAt))}
                        {" · "}
                        {revision.status === "published"
                          ? "已发布"
                          : revision.status === "scheduled"
                            ? "定时发布"
                            : revision.status === "archived" ? "已归档" : "草稿"}
                      </small>
                    </span>
                    <button type="button" onClick={() => {
                      setSelectedRevision(revision);
                      setConfirmation("restore");
                    }}>
                      {index === 0 ? "恢复已提交版本" : "恢复此版本"}
                    </button>
                  </article>
                )) : (
                  <p>保存一次文章后，版本记录会出现在这里。</p>
                )}
              </div>
            </details>
          )}
        </>
      )}

      {!isNew && state.status !== "archived" && (
        <section className="studio-danger-zone" aria-labelledby="archive-title">
          <div><h2 id="archive-title">归档文章</h2><p>文章会从访客页面隐藏，但正文、标签和项目关系都会保留。</p></div>
          <button type="button" onClick={() => setConfirmation("archive")}>归档文章</button>
        </section>
      )}
      </fieldset>

      <ConfirmationDialog
        open={Boolean(confirmationCopy)}
        title={confirmationCopy?.title ?? ""}
        description={confirmationCopy?.description ?? ""}
        confirmLabel={confirmationCopy?.confirmLabel ?? ""}
        busyLabel={confirmationCopy?.busyLabel ?? ""}
        busy={saving}
        danger={confirmation === "archive"}
        onCancel={() => setConfirmation(null)}
        onConfirm={confirmAction}
      />
    </form>
  );
}
