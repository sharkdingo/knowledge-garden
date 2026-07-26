"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { AlgorithmAuthoringConfig, AlgorithmReference } from "../../domain/content";
import type {
  StudioAlgorithmProblem,
  StudioAlgorithmProblemInput,
  StudioAlgorithmStatus,
} from "../../domain/studio";
import { ConfirmationDialog } from "../components/confirmation-dialog";

type Confirmation = "publish" | "unpublish" | "archive" | null;

function currentDate(): string {
  const now = new Date();
  const localTime = new Date(now.getTime() - now.getTimezoneOffset() * 60_000);
  return localTime.toISOString().slice(0, 10);
}

function uniqueId(prefix: string): string {
  return `${prefix}-${crypto.randomUUID()}`;
}

function emptyProblem(authoring: AlgorithmAuthoringConfig): StudioAlgorithmProblemInput {
  const solutionId = uniqueId("approach");
  const defaultPlatform = authoring.platformPresets.find(
    (preset) => preset.id === authoring.defaultPlatformId
  ) ?? authoring.platformPresets[0];
  return {
    slug: "",
    platform: defaultPlatform?.label ?? "",
    problemId: "",
    title: "",
    difficulty: "medium",
    sourceUrl: "",
    summary: "",
    statement: "",
    constraints: [],
    status: "draft",
    solvedAt: currentDate(),
    featured: false,
    tags: [],
    solutions: [{
      id: solutionId,
      title: "",
      intuition: "",
      steps: [],
      proof: "",
      timeComplexity: "",
      spaceComplexity: "",
      pitfalls: [],
      codeBlocks: [{
        id: uniqueId("code"),
        language: "",
        label: "",
        code: "",
      }],
    }],
    references: [],
  };
}

function toInput(problem: StudioAlgorithmProblem): StudioAlgorithmProblemInput {
  return {
    slug: problem.slug,
    platform: problem.platform,
    problemId: problem.problemId,
    title: problem.title,
    difficulty: problem.difficulty,
    sourceUrl: problem.sourceUrl,
    summary: problem.summary,
    statement: problem.statement,
    constraints: [...problem.constraints],
    status: problem.status,
    solvedAt: problem.solvedAt,
    featured: problem.featured,
    tags: [...problem.tags],
    solutions: problem.solutions.map((solution) => ({
      ...solution,
      steps: [...solution.steps],
      pitfalls: [...solution.pitfalls],
      codeBlocks: solution.codeBlocks.map((block) => ({ ...block })),
    })),
    references: problem.references.map((reference) => ({ ...reference })),
  };
}

function lineList(value: string): string[] {
  return value.split("\n").map((item) => item.trim()).filter(Boolean);
}

function tagList(value: string): string[] {
  return value.split(/[,，]/).map((item) => item.trim()).filter(Boolean);
}

export function ProblemEditor({
  problem,
  authoring,
}: {
  problem: StudioAlgorithmProblem | null;
  authoring: AlgorithmAuthoringConfig;
}) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [state, setState] = useState<StudioAlgorithmProblemInput>(
    () => problem ? toInput(problem) : emptyProblem(authoring),
  );
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [confirmation, setConfirmation] = useState<Confirmation>(null);
  const isNew = problem === null;

  useEffect(() => {
    const preventLoss = (event: BeforeUnloadEvent) => {
      if (!dirty) return;
      event.preventDefault();
    };
    window.addEventListener("beforeunload", preventLoss);
    return () => window.removeEventListener("beforeunload", preventLoss);
  }, [dirty]);

  function patch<K extends keyof StudioAlgorithmProblemInput>(
    key: K,
    value: StudioAlgorithmProblemInput[K],
  ) {
    setState((current) => ({ ...current, [key]: value }));
    setDirty(true);
    setMessage("");
  }

  function patchSolution(
    index: number,
    key: keyof StudioAlgorithmProblemInput["solutions"][number],
    value: string | string[],
  ) {
    setState((current) => ({
      ...current,
      solutions: current.solutions.map((solution, solutionIndex) =>
        solutionIndex === index ? { ...solution, [key]: value } : solution
      ),
    }));
    setDirty(true);
    setMessage("");
  }

  function patchCode(
    solutionIndex: number,
    codeIndex: number,
    key: "language" | "label" | "code",
    value: string,
  ) {
    setState((current) => ({
      ...current,
      solutions: current.solutions.map((solution, currentSolutionIndex) =>
        currentSolutionIndex === solutionIndex
          ? {
              ...solution,
              codeBlocks: solution.codeBlocks.map((block, currentCodeIndex) =>
                currentCodeIndex === codeIndex ? { ...block, [key]: value } : block
              ),
            }
          : solution
      ),
    }));
    setDirty(true);
    setMessage("");
  }

  function addSolution() {
    const solutionId = uniqueId("approach");
    setState((current) => ({
      ...current,
      solutions: [...current.solutions, {
        id: solutionId,
        title: "",
        intuition: "",
        steps: [],
        proof: "",
        timeComplexity: "",
        spaceComplexity: "",
        pitfalls: [],
        codeBlocks: [{
          id: uniqueId("code"),
          language: "",
          label: "",
          code: "",
        }],
      }],
    }));
    setDirty(true);
  }

  function removeSolution(index: number) {
    setState((current) => ({
      ...current,
      references: current.references.map((reference) =>
        reference.solutionId === current.solutions[index]?.id
          ? { ...reference, solutionId: undefined }
          : reference
      ),
      solutions: current.solutions.filter((_, solutionIndex) => solutionIndex !== index),
    }));
    setDirty(true);
  }

  function addCode(
    solutionIndex: number,
    preset?: AlgorithmAuthoringConfig["languagePresets"][number],
  ) {
    setState((current) => ({
      ...current,
      solutions: current.solutions.map((solution, currentIndex) => {
        if (currentIndex !== solutionIndex) return solution;
        const blankIndex = preset
          ? solution.codeBlocks.findIndex((block) =>
              !block.language && !block.label && !block.code
            )
          : -1;
        if (blankIndex >= 0 && preset) {
          return {
            ...solution,
            codeBlocks: solution.codeBlocks.map((block, codeIndex) =>
              codeIndex === blankIndex
                ? { ...block, language: preset.id, label: preset.label }
                : block
            ),
          };
        }
        return {
          ...solution,
          codeBlocks: [...solution.codeBlocks, {
            id: uniqueId("code"),
            language: preset?.id ?? "",
            label: preset?.label ?? "",
            code: "",
          }],
        };
      }),
    }));
    setDirty(true);
  }

  function patchReference(
    index: number,
    key: Exclude<keyof AlgorithmReference, "id">,
    value: string | undefined,
  ) {
    setState((current) => ({
      ...current,
      references: current.references.map((reference, referenceIndex) =>
        referenceIndex === index ? { ...reference, [key]: value } : reference
      ),
    }));
    setDirty(true);
    setMessage("");
  }

  function addReference() {
    setState((current) => ({
      ...current,
      references: [...current.references, {
        id: uniqueId("reference"),
        title: "",
        author: "",
        url: "",
        note: "",
        accessedAt: currentDate(),
      }],
    }));
    setDirty(true);
    setMessage("");
  }

  function removeReference(index: number) {
    setState((current) => ({
      ...current,
      references: current.references.filter((_, referenceIndex) =>
        referenceIndex !== index
      ),
    }));
    setDirty(true);
    setMessage("");
  }

  function removeCode(solutionIndex: number, codeIndex: number) {
    setState((current) => ({
      ...current,
      solutions: current.solutions.map((solution, currentIndex) =>
        currentIndex === solutionIndex
          ? {
              ...solution,
              codeBlocks: solution.codeBlocks.filter((_, currentCodeIndex) =>
                currentCodeIndex !== codeIndex
              ),
            }
          : solution
      ),
    }));
    setDirty(true);
  }

  async function save(status: StudioAlgorithmStatus) {
    const form = formRef.current;
    const draftIdentityFields = form?.querySelectorAll<HTMLInputElement>(
      "[data-draft-required]",
    ) ?? [];
    const invalidDraftIdentity = [...draftIdentityFields].find((field) => !field.checkValidity());
    if (status === "draft" && invalidDraftIdentity) {
      invalidDraftIdentity.reportValidity();
      invalidDraftIdentity.focus();
      setMessage("保存草稿前，请先填写平台、题号、Slug 与完成日期。");
      return;
    }
    if (status === "published" && !form?.reportValidity()) {
      setMessage("发布前请补全所有标记出的必填内容。");
      setConfirmation(null);
      return;
    }
    setSaving(true);
    setMessage("");
    try {
      const response = await fetch(
        isNew ? "/api/studio/problems" : `/api/studio/problems/${problem.slug}`,
        {
          method: isNew ? "POST" : "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...state, status }),
        },
      );
      const result = await response.json() as { error?: string; slug?: string };
      if (!response.ok) throw new Error(result.error ?? "保存失败，请稍后重试。");
      setState((current) => ({ ...current, status }));
      setDirty(false);
      setMessage(
        status === "published"
          ? "题解已经发布。"
          : status === "archived" ? "题解已经归档。" : "草稿已经保存。",
      );
      if (isNew && result.slug) router.replace(`/studio/problems/${result.slug}`);
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "保存失败，请稍后重试。");
    } finally {
      setSaving(false);
      setConfirmation(null);
    }
  }

  async function archive() {
    if (!problem) return;
    setSaving(true);
    try {
      const response = await fetch(`/api/studio/problems/${problem.slug}`, { method: "DELETE" });
      const result = await response.json() as { error?: string };
      if (!response.ok) throw new Error(result.error ?? "归档失败。");
      setDirty(false);
      router.push("/studio/problems");
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "归档失败。");
    } finally {
      setSaving(false);
      setConfirmation(null);
    }
  }

  const confirmationCopy = confirmation === "publish"
    ? {
        title: "确认发布这篇题解？",
        description: "发布后，题目会进入公开题库、全站搜索和站点地图。",
        confirmLabel: "确认发布",
        busyLabel: "发布中…",
      }
    : confirmation === "unpublish"
      ? {
          title: "确认转为草稿？",
          description: "题解会立即从公开题库隐藏，但内容和永久链接仍会保留。",
          confirmLabel: "转为草稿",
          busyLabel: "处理中…",
        }
      : {
          title: "确认归档这篇题解？",
          description: "题解会从公开区域隐藏，并保留在内容工作室中。",
          confirmLabel: "确认归档",
          busyLabel: "归档中…",
        };
  const selectedPlatform = authoring.platformPresets.find(
    (preset) => preset.label === state.platform || preset.id === state.platform.toLowerCase()
  );

  return (
    <>
      <form
        ref={formRef}
        className="studio-editor problem-editor"
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          void save(state.status === "published" ? "published" : "draft");
        }}
      >
        <div className="studio-editor-toolbar">
          <div><span className={dirty ? "dirty" : ""} aria-hidden="true" /><p>{dirty ? "有未保存更改" : "全部更改已保存"}</p></div>
          {!isNew && state.status === "published" && (
            <Link className="button button-secondary" href={`/problems/${state.slug}`}>查看公开页 ↗</Link>
          )}
          {state.status === "published" ? (
            <>
              <button className="button button-secondary" type="button" disabled={saving} onClick={() => setConfirmation("unpublish")}>转为草稿</button>
              <button className="button button-primary" type="submit" disabled={saving || !dirty}>{saving ? "保存中…" : "保存更新"}</button>
            </>
          ) : state.status === "archived" ? (
            <button className="button button-primary" type="button" disabled={saving} onClick={() => void save("draft")}>恢复为草稿</button>
          ) : (
            <>
              <button className="button button-secondary" type="submit" disabled={saving || !dirty}>{saving ? "保存中…" : "保存草稿"}</button>
              <button className="button button-primary" type="button" disabled={saving} onClick={() => setConfirmation("publish")}>发布题解</button>
            </>
          )}
        </div>
        <p className="studio-form-message" role="status" aria-live="polite">{message}</p>

        <section className="studio-form-section" aria-labelledby="problem-basic-title">
          <header><p className="eyebrow">PROBLEM</p><h2 id="problem-basic-title">题目信息</h2></header>
          <div className="studio-form-grid">
            <label>
              <span>平台</span>
              <input
                required
                data-draft-required
                list="algorithm-platform-presets"
                value={state.platform}
                onChange={(event) => patch("platform", event.target.value)}
              />
              <datalist id="algorithm-platform-presets">
                {authoring.platformPresets.map((preset) => (
                  <option key={preset.id} value={preset.label} />
                ))}
              </datalist>
            </label>
            <label><span>题号</span><input required data-draft-required value={state.problemId} onChange={(event) => patch("problemId", event.target.value)} placeholder="3534 / P1001" /></label>
            <label><span>Slug</span><input required data-draft-required disabled={!isNew} value={state.slug} onChange={(event) => patch("slug", event.target.value.toLowerCase())} placeholder="path-existence-queries-ii" /></label>
            <label>
              <span>难度</span>
              <select value={state.difficulty} onChange={(event) => patch("difficulty", event.target.value as StudioAlgorithmProblemInput["difficulty"])}>
                <option value="easy">简单</option><option value="medium">中等</option><option value="hard">困难</option>
              </select>
            </label>
            <label className="wide"><span>标题</span><input required value={state.title} onChange={(event) => patch("title", event.target.value)} /></label>
            <label className="wide">
              <span>原题链接</span>
              <input
                required
                type="url"
                value={state.sourceUrl}
                onChange={(event) => patch("sourceUrl", event.target.value)}
                placeholder={selectedPlatform?.sourceHint ?? "https://..."}
              />
            </label>
            <label><span>完成日期</span><input required data-draft-required type="date" value={state.solvedAt} onChange={(event) => patch("solvedAt", event.target.value)} /></label>
            <label className="studio-check"><input type="checkbox" checked={state.featured} onChange={(event) => patch("featured", event.target.checked)} /><span>设为精选题解</span></label>
            <label className="wide"><span>标签</span><input value={state.tags.join(", ")} onChange={(event) => patch("tags", tagList(event.target.value))} placeholder="并查集, 离线查询, 图论" /><small>使用逗号分隔，最多 16 个。</small></label>
          </div>
        </section>

        <section className="studio-form-section" aria-labelledby="problem-reading-title">
          <header><p className="eyebrow">EXPLANATION</p><h2 id="problem-reading-title">题意与边界</h2></header>
          <div className="studio-form-grid">
            <label className="wide"><span>摘要</span><textarea required rows={3} value={state.summary} onChange={(event) => patch("summary", event.target.value)} /></label>
            <label className="wide"><span>题意重述</span><textarea required rows={7} value={state.statement} onChange={(event) => patch("statement", event.target.value)} /><small>建议用自己的语言概括，并链接原题，不要直接复制受版权保护的完整题面。{authoring.latexHelp}</small></label>
            <label className="wide"><span>约束与边界</span><textarea rows={5} value={state.constraints.join("\n")} onChange={(event) => patch("constraints", lineList(event.target.value))} /><small>每行一条，例如 n ≤ 2 × 10⁵。</small></label>
          </div>
        </section>

        <section className="studio-form-section" aria-labelledby="problem-solutions-title">
          <header>
            <div><p className="eyebrow">APPROACHES</p><h2 id="problem-solutions-title">解法与代码</h2></div>
            <button className="studio-inline-action" type="button" onClick={addSolution}>＋ 添加解法</button>
          </header>
          <div className="studio-algorithm-solutions">
            {state.solutions.map((solution, solutionIndex) => (
              <fieldset key={`${solutionIndex}-${solution.id}`}>
                <legend>解法 {String(solutionIndex + 1).padStart(2, "0")}</legend>
                <div className="studio-form-grid">
                  <label className="wide"><span>解法标题</span><input required value={solution.title} onChange={(event) => patchSolution(solutionIndex, "title", event.target.value)} /></label>
                  <label className="wide"><span>核心直觉</span><textarea required rows={4} value={solution.intuition} onChange={(event) => patchSolution(solutionIndex, "intuition", event.target.value)} /><small>{authoring.latexHelp}</small></label>
                  <label className="wide"><span>推导步骤</span><textarea required rows={6} value={solution.steps.join("\n")} onChange={(event) => patchSolution(solutionIndex, "steps", lineList(event.target.value))} /><small>每行一步，保持可扫描。</small></label>
                  <label className="wide"><span>正确性说明</span><textarea required rows={6} value={solution.proof} onChange={(event) => patchSolution(solutionIndex, "proof", event.target.value)} /></label>
                  <label><span>时间复杂度</span><input required value={solution.timeComplexity} onChange={(event) => patchSolution(solutionIndex, "timeComplexity", event.target.value)} placeholder="$O(n \\log n)$" /></label>
                  <label><span>空间复杂度</span><input required value={solution.spaceComplexity} onChange={(event) => patchSolution(solutionIndex, "spaceComplexity", event.target.value)} placeholder="$O(n)$" /></label>
                  <label className="wide"><span>易错点</span><textarea rows={4} value={solution.pitfalls.join("\n")} onChange={(event) => patchSolution(solutionIndex, "pitfalls", lineList(event.target.value))} /><small>每行一条。</small></label>
                </div>

                <div className="studio-code-presets" aria-label="快速添加语言实现">
                  <span>快速添加</span>
                  {authoring.languagePresets.map((preset) => {
                    const present = solution.codeBlocks.some((block) => block.language === preset.id);
                    return (
                      <button
                        key={preset.id}
                        type="button"
                        disabled={present}
                        aria-pressed={present}
                        onClick={() => addCode(solutionIndex, preset)}
                      >
                        {present ? "✓ " : "＋ "}{preset.label}
                      </button>
                    );
                  })}
                </div>
                <div className="studio-code-editors">
                  {solution.codeBlocks.map((block, codeIndex) => (
                    <section key={`${codeIndex}-${block.id}`}>
                      <header>
                        <strong>代码 {String(codeIndex + 1).padStart(2, "0")}</strong>
                        <button type="button" disabled={solution.codeBlocks.length <= 1} onClick={() => removeCode(solutionIndex, codeIndex)}>移除</button>
                      </header>
                      <div className="studio-form-grid">
                        <label><span>语言 ID</span><input required value={block.language} onChange={(event) => patchCode(solutionIndex, codeIndex, "language", event.target.value)} placeholder="cpp / python / java" /></label>
                        <label><span>显示名称</span><input value={block.label} onChange={(event) => patchCode(solutionIndex, codeIndex, "label", event.target.value)} placeholder="C++ 23" /></label>
                        <label className="wide"><span>代码</span><textarea className="studio-code-input" required rows={18} spellCheck={false} value={block.code} onChange={(event) => patchCode(solutionIndex, codeIndex, "code", event.target.value)} /></label>
                      </div>
                    </section>
                  ))}
                  <button className="studio-inline-action" type="button" onClick={() => addCode(solutionIndex)}>＋ 添加语言实现</button>
                </div>
                <button className="studio-inline-action danger" type="button" disabled={state.solutions.length <= 1} onClick={() => removeSolution(solutionIndex)}>移除此解法</button>
              </fieldset>
            ))}
          </div>
        </section>

        <section className="studio-form-section" aria-labelledby="problem-references-title">
          <header>
            <div>
              <p className="eyebrow">REFERENCES</p>
              <h2 id="problem-references-title">参考与致谢</h2>
            </div>
            <button className="studio-inline-action" type="button" onClick={addReference}>
              ＋ 添加引用
            </button>
          </header>
          <p className="studio-help">{authoring.referenceHelp}</p>
          {state.references.length === 0 ? (
            <p className="studio-empty-note">当前没有引用；完全独立完成的题解可以保持为空。</p>
          ) : (
            <div className="studio-option-grid">
              {state.references.map((reference, referenceIndex) => (
                <fieldset key={`${referenceIndex}-${reference.id}`}>
                  <legend>引用 {String(referenceIndex + 1).padStart(2, "0")}</legend>
                  <label>
                    <span>关联范围</span>
                    <select
                      value={reference.solutionId ?? ""}
                      onChange={(event) =>
                        patchReference(
                          referenceIndex,
                          "solutionId",
                          event.target.value || undefined,
                        )
                      }
                    >
                      <option value="">全文参考</option>
                      {state.solutions.map((solution, solutionIndex) => (
                        <option key={solution.id} value={solution.id}>
                          解法 {String(solutionIndex + 1).padStart(2, "0")} · {solution.title || "未命名"}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label><span>标题</span><input required value={reference.title} onChange={(event) => patchReference(referenceIndex, "title", event.target.value)} /></label>
                  <label><span>作者 / 组织</span><input required value={reference.author} onChange={(event) => patchReference(referenceIndex, "author", event.target.value)} /></label>
                  <label><span>原始链接</span><input required type="url" value={reference.url} onChange={(event) => patchReference(referenceIndex, "url", event.target.value)} placeholder="https://..." /></label>
                  <label><span>访问日期</span><input required type="date" value={reference.accessedAt} onChange={(event) => patchReference(referenceIndex, "accessedAt", event.target.value)} /></label>
                  <label><span>借鉴说明</span><textarea rows={3} value={reference.note} onChange={(event) => patchReference(referenceIndex, "note", event.target.value)} /></label>
                  <button className="studio-inline-action danger" type="button" onClick={() => removeReference(referenceIndex)}>
                    移除此引用
                  </button>
                </fieldset>
              ))}
            </div>
          )}
        </section>

        {!isNew && state.status !== "archived" && (
          <section className="studio-danger-zone">
            <h2>归档题解</h2>
            <p>归档后公开页面会隐藏，数据仍可恢复。</p>
            <button type="button" disabled={saving} onClick={() => setConfirmation("archive")}>归档</button>
          </section>
        )}
      </form>

      <ConfirmationDialog
        open={confirmation !== null}
        title={confirmationCopy.title}
        description={confirmationCopy.description}
        confirmLabel={confirmationCopy.confirmLabel}
        busyLabel={confirmationCopy.busyLabel}
        busy={saving}
        danger={confirmation === "archive" || confirmation === "unpublish"}
        onCancel={() => setConfirmation(null)}
        onConfirm={() => {
          if (confirmation === "publish") void save("published");
          if (confirmation === "unpublish") void save("draft");
          if (confirmation === "archive") void archive();
        }}
      />
    </>
  );
}
