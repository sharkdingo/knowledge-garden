"use client";

import { useState } from "react";
import type { StudioCategory } from "../../domain/studio";
import { studioRequest } from "../studio-client";

type Draft = Pick<StudioCategory, "id" | "name" | "description" | "sortOrder">;
const EMPTY: Draft = { id: "", name: "", description: "", sortOrder: 0 };

export function CategoryManager({ initialCategories }: { initialCategories: StudioCategory[] }) {
  const [categories, setCategories] = useState(initialCategories);
  const [draft, setDraft] = useState<Draft>(EMPTY);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function refresh() {
    const payload = await studioRequest<{ categories?: StudioCategory[] }>(
      "/api/studio/categories",
      undefined,
      "无法刷新分类列表。",
    );
    if (payload.categories) setCategories(payload.categories);
  }

  async function save() {
    setBusy(true);
    setMessage("");
    const existing = categories.some((item) => item.id === draft.id);
    try {
      await studioRequest(
        existing
          ? `/api/studio/categories/${encodeURIComponent(draft.id)}`
          : "/api/studio/categories",
        {
          method: existing ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(draft),
        },
        "保存分类失败。",
      );
      await refresh();
      setDraft(EMPTY);
      setMessage(existing ? "分类已更新。" : "分类已创建，现在可以用于文章。");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "保存分类失败。");
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string) {
    if (!window.confirm("确认删除这个未使用的分类？")) return;
    setBusy(true);
    setMessage("");
    try {
      await studioRequest(
        `/api/studio/categories/${encodeURIComponent(id)}`,
        { method: "DELETE" },
        "删除分类失败。",
      );
      await refresh();
      if (draft.id === id) setDraft(EMPTY);
      setMessage("分类已删除。");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "删除分类失败。");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="studio-category-layout">
      <div className="studio-category-list">
        {categories.map((category) => (
          <article key={category.id}>
            <div>
              <strong>{category.name}</strong>
              <small>{category.description || "暂无说明"} · {category.articleCount} 篇文章</small>
            </div>
            <button type="button" onClick={() => setDraft(category)}>编辑</button>
            <button type="button" disabled={busy || category.articleCount > 0} onClick={() => void remove(category.id)}>
              删除
            </button>
          </article>
        ))}
        {!categories.length && <div className="studio-empty compact"><strong>先创建第一个分类</strong><p>例如「工程实践」或「算法题解」，之后即可创建文章。</p></div>}
      </div>
      <form className="studio-category-form" onSubmit={(event) => { event.preventDefault(); void save(); }}>
        <h2>{categories.some((item) => item.id === draft.id) ? "编辑分类" : "新建分类"}</h2>
        <label>ID<input value={draft.id} disabled={categories.some((item) => item.id === draft.id)} onChange={(event) => setDraft({ ...draft, id: event.target.value })} placeholder="engineering" /></label>
        <label>名称<input value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} /></label>
        <label>说明<textarea value={draft.description} onChange={(event) => setDraft({ ...draft, description: event.target.value })} /></label>
        <label>排序<input type="number" min="0" max="9999" value={draft.sortOrder} onChange={(event) => setDraft({ ...draft, sortOrder: Number(event.target.value) })} /></label>
        <div><button className="button button-primary" disabled={busy} type="submit">{busy ? "保存中…" : "保存分类"}</button><button type="button" onClick={() => setDraft(EMPTY)}>清空</button></div>
        <p role="status" aria-live="polite">{message}</p>
      </form>
    </section>
  );
}
