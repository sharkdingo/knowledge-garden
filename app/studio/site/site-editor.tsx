"use client";

import { useState } from "react";
import type { StudioSiteSettings } from "../../domain/studio";
import { studioRequest } from "../studio-client";
import { useStudioUnsavedChanges } from "../components/unsaved-changes";

export function SiteEditor({ initial }: { initial: StudioSiteSettings }) {
  const [settings, setSettings] = useState(initial);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useStudioUnsavedChanges(dirty);

  function hero<K extends keyof StudioSiteSettings["hero"]>(
    key: K,
    value: StudioSiteSettings["hero"][K],
  ) {
    setSettings((current) => ({
      ...current,
      hero: { ...current.hero, [key]: value },
    }));
    setDirty(true);
    setMessage("");
  }

  function theme<K extends keyof StudioSiteSettings["theme"]>(
    key: K,
    value: StudioSiteSettings["theme"][K],
  ) {
    setSettings((current) => ({
      ...current,
      theme: { ...current.theme, [key]: value },
    }));
    setDirty(true);
    setMessage("");
  }

  function home<K extends keyof StudioSiteSettings["home"]>(
    key: K,
    value: StudioSiteSettings["home"][K],
  ) {
    setSettings((current) => ({
      ...current,
      home: { ...current.home, [key]: value },
    }));
    setDirty(true);
    setMessage("");
  }

  function daily<K extends keyof Omit<StudioSiteSettings["daily"], "greetings" | "modes">>(
    key: K,
    value: StudioSiteSettings["daily"][K],
  ) {
    setSettings((current) => ({
      ...current,
      daily: { ...current.daily, [key]: value },
    }));
    setDirty(true);
    setMessage("");
  }

  function greeting<K extends keyof StudioSiteSettings["daily"]["greetings"]>(
    key: K,
    value: string,
  ) {
    setSettings((current) => ({
      ...current,
      daily: {
        ...current.daily,
        greetings: { ...current.daily.greetings, [key]: value },
      },
    }));
    setDirty(true);
    setMessage("");
  }

  function engagement<K extends keyof Omit<StudioSiteSettings["engagement"], "options">>(
    key: K,
    value: StudioSiteSettings["engagement"][K],
  ) {
    setSettings((current) => ({
      ...current,
      engagement: { ...current.engagement, [key]: value },
    }));
    setDirty(true);
    setMessage("");
  }

  function algorithmPage<K extends keyof StudioSiteSettings["algorithms"]["page"]>(
    key: K,
    value: string,
  ) {
    setSettings((current) => ({
      ...current,
      algorithms: {
        ...current.algorithms,
        page: { ...current.algorithms.page, [key]: value },
      },
    }));
    setDirty(true);
    setMessage("");
  }

  function algorithmHub<K extends keyof Omit<
    StudioSiteSettings["algorithms"]["hub"],
    "difficultyLabels"
  >>(key: K, value: string) {
    setSettings((current) => ({
      ...current,
      algorithms: {
        ...current.algorithms,
        hub: { ...current.algorithms.hub, [key]: value },
      },
    }));
    setDirty(true);
    setMessage("");
  }

  function algorithmDifficulty(
    key: keyof StudioSiteSettings["algorithms"]["hub"]["difficultyLabels"],
    value: string,
  ) {
    setSettings((current) => ({
      ...current,
      algorithms: {
        ...current.algorithms,
        hub: {
          ...current.algorithms.hub,
          difficultyLabels: {
            ...current.algorithms.hub.difficultyLabels,
            [key]: value,
          },
        },
      },
    }));
    setDirty(true);
    setMessage("");
  }

  function algorithmAuthoring<K extends keyof Omit<
    StudioSiteSettings["algorithms"]["authoring"],
    "platformPresets" | "languagePresets"
  >>(key: K, value: StudioSiteSettings["algorithms"]["authoring"][K]) {
    setSettings((current) => ({
      ...current,
      algorithms: {
        ...current.algorithms,
        authoring: { ...current.algorithms.authoring, [key]: value },
      },
    }));
    setDirty(true);
    setMessage("");
  }

  function platformPreset(
    index: number,
    key: keyof StudioSiteSettings["algorithms"]["authoring"]["platformPresets"][number],
    value: string,
  ) {
    setSettings((current) => ({
      ...current,
      algorithms: {
        ...current.algorithms,
        authoring: {
          ...current.algorithms.authoring,
          platformPresets: current.algorithms.authoring.platformPresets.map((preset, presetIndex) =>
            presetIndex === index ? { ...preset, [key]: value } : preset
          ),
        },
      },
    }));
    setDirty(true);
    setMessage("");
  }

  function languagePreset(
    index: number,
    key: keyof StudioSiteSettings["algorithms"]["authoring"]["languagePresets"][number],
    value: string,
  ) {
    setSettings((current) => ({
      ...current,
      algorithms: {
        ...current.algorithms,
        authoring: {
          ...current.algorithms.authoring,
          languagePresets: current.algorithms.authoring.languagePresets.map((preset, presetIndex) =>
            presetIndex === index ? { ...preset, [key]: value } : preset
          ),
        },
      },
    }));
    setDirty(true);
    setMessage("");
  }

  function addPlatformPreset() {
    setSettings((current) => ({
      ...current,
      algorithms: {
        ...current.algorithms,
        authoring: {
          ...current.algorithms.authoring,
          platformPresets: [
            ...current.algorithms.authoring.platformPresets,
            { id: `platform-${current.algorithms.authoring.platformPresets.length + 1}`, label: "", sourceHint: "" },
          ],
        },
      },
    }));
    setDirty(true);
    setMessage("");
  }

  function addLanguagePreset() {
    setSettings((current) => ({
      ...current,
      algorithms: {
        ...current.algorithms,
        authoring: {
          ...current.algorithms.authoring,
          languagePresets: [
            ...current.algorithms.authoring.languagePresets,
            { id: `language-${current.algorithms.authoring.languagePresets.length + 1}`, label: "" },
          ],
        },
      },
    }));
    setDirty(true);
    setMessage("");
  }

  function removePlatformPreset(index: number) {
    setSettings((current) => ({
      ...current,
      algorithms: {
        ...current.algorithms,
        authoring: {
          ...current.algorithms.authoring,
          platformPresets: current.algorithms.authoring.platformPresets.filter((_, presetIndex) =>
            presetIndex !== index
          ),
        },
      },
    }));
    setDirty(true);
    setMessage("");
  }

  function removeLanguagePreset(index: number) {
    setSettings((current) => ({
      ...current,
      algorithms: {
        ...current.algorithms,
        authoring: {
          ...current.algorithms.authoring,
          languagePresets: current.algorithms.authoring.languagePresets.filter((_, presetIndex) =>
            presetIndex !== index
          ),
        },
      },
    }));
    setDirty(true);
    setMessage("");
  }

  function reactionOption(
    index: number,
    key: keyof StudioSiteSettings["engagement"]["options"][number],
    value: string,
  ) {
    setSettings((current) => ({
      ...current,
      engagement: {
        ...current.engagement,
        options: current.engagement.options.map((option, optionIndex) =>
          optionIndex === index ? { ...option, [key]: value } : option
        ),
      },
    }));
    setDirty(true);
    setMessage("");
  }

  function addReactionOption() {
    setSettings((current) => ({
      ...current,
      engagement: {
        ...current.engagement,
        options: [
          ...current.engagement.options,
          { id: `response-${current.engagement.options.length + 1}`, label: "", symbol: "", reply: "" },
        ],
      },
    }));
    setDirty(true);
    setMessage("");
  }

  function removeReactionOption(index: number) {
    setSettings((current) => ({
      ...current,
      engagement: {
        ...current.engagement,
        options: current.engagement.options.filter((_, optionIndex) => optionIndex !== index),
      },
    }));
    setDirty(true);
    setMessage("");
  }

  function dailyMode(
    index: number,
    key: keyof StudioSiteSettings["daily"]["modes"][number],
    value: string,
  ) {
    setSettings((current) => ({
      ...current,
      daily: {
        ...current.daily,
        modes: current.daily.modes.map((mode, modeIndex) =>
          modeIndex === index ? { ...mode, [key]: value } : mode
        ),
      },
    }));
    setDirty(true);
    setMessage("");
  }

  async function save(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    try {
      const result = await studioRequest<{ version?: string }>(
        "/api/studio/site",
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(settings),
        },
        "保存站点设置失败，请稍后重试。",
      );
      if (result.version) {
        setSettings((current) => ({ ...current, version: result.version as string }));
      }
      setDirty(false);
      setMessage("首页与主题设置已经保存。");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "保存失败，请稍后重试。");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="studio-editor site-editor" aria-busy={saving} onSubmit={save}>
      <div className="studio-editor-toolbar">
        <div><span className={dirty ? "dirty" : ""} aria-hidden="true" /><p>{dirty ? "有未保存更改" : "全部更改已保存"}</p></div>
        <button className="button button-primary" type="submit" disabled={saving || !dirty}>
          {saving ? "保存中…" : "保存站点设置"}
        </button>
      </div>
      <p className="studio-form-message" role="status" aria-live="polite">{message}</p>

      <fieldset className="studio-editor-fields" disabled={saving}>
      <section className="studio-form-section" aria-labelledby="hero-settings-title">
        <header><p className="eyebrow">HERO</p><h2 id="hero-settings-title">首页首屏</h2></header>
        <div className="studio-form-grid">
          <label>
            <span>眉题</span>
            <input value={settings.hero.eyebrow} onChange={(event) => hero("eyebrow", event.target.value)} />
          </label>
          <label>
            <span>主标题</span>
            <textarea rows={3} value={settings.hero.titleLines.join("\n")} onChange={(event) => hero("titleLines", event.target.value.split("\n").filter(Boolean))} />
            <small>每行显示为一行标题，最多三行。</small>
          </label>
          <label className="wide">
            <span>首页导语</span>
            <textarea rows={4} value={settings.hero.lead} onChange={(event) => hero("lead", event.target.value)} />
          </label>
          <label>
            <span>当前状态标签</span>
            <input value={settings.hero.nowLabel} onChange={(event) => hero("nowLabel", event.target.value)} />
          </label>
          <label>
            <span>当前状态</span>
            <input value={settings.hero.nowValue} onChange={(event) => hero("nowValue", event.target.value)} />
          </label>
          <label>
            <span>主要按钮</span>
            <input value={settings.hero.primaryLabel} onChange={(event) => hero("primaryLabel", event.target.value)} />
          </label>
          <label>
            <span>主要按钮链接</span>
            <input value={settings.hero.primaryHref} onChange={(event) => hero("primaryHref", event.target.value)} />
          </label>
          <label>
            <span>次要按钮</span>
            <input value={settings.hero.secondaryLabel} onChange={(event) => hero("secondaryLabel", event.target.value)} />
          </label>
          <label>
            <span>次要按钮链接</span>
            <input value={settings.hero.secondaryHref} onChange={(event) => hero("secondaryHref", event.target.value)} />
          </label>
          <label className="wide">
            <span>图片说明</span>
            <input value={settings.hero.caption} onChange={(event) => hero("caption", event.target.value)} />
          </label>
        </div>
      </section>

      <section className="studio-form-section" aria-labelledby="home-guide-settings-title">
        <header><p className="eyebrow">VISITOR GUIDE</p><h2 id="home-guide-settings-title">访客导览</h2></header>
        <div className="studio-form-grid">
          <label>
            <span>眉题</span>
            <input value={settings.home.eyebrow} onChange={(event) => home("eyebrow", event.target.value)} />
          </label>
          <label>
            <span>导览标题</span>
            <input value={settings.home.title} onChange={(event) => home("title", event.target.value)} />
          </label>
          <label className="wide">
            <span>导览说明</span>
            <textarea rows={3} value={settings.home.description} onChange={(event) => home("description", event.target.value)} />
          </label>
          <label>
            <span>文章入口标签</span>
            <input value={settings.home.writingLabel} onChange={(event) => home("writingLabel", event.target.value)} />
          </label>
          <label>
            <span>项目入口标签</span>
            <input value={settings.home.projectsLabel} onChange={(event) => home("projectsLabel", event.target.value)} />
          </label>
          <label>
            <span>主题入口标签</span>
            <input value={settings.home.topicsLabel} onChange={(event) => home("topicsLabel", event.target.value)} />
          </label>
          <label>
            <span>星图入口标签</span>
            <input value={settings.home.playgroundLabel} onChange={(event) => home("playgroundLabel", event.target.value)} />
          </label>
          <label>
            <span>继续阅读标签</span>
            <input value={settings.home.continueLabel} onChange={(event) => home("continueLabel", event.target.value)} />
          </label>
        </div>
      </section>

      <section className="studio-form-section" aria-labelledby="intro-settings-title">
        <header><p className="eyebrow">ENTRANCE</p><h2 id="intro-settings-title">首次访问开场</h2></header>
        <div className="studio-form-grid">
          <label className="studio-check wide">
            <input type="checkbox" checked={settings.hero.introEnabled} onChange={(event) => hero("introEnabled", event.target.checked)} />
            <span>为首次访问者启用可跳过的开场</span>
          </label>
          <label>
            <span>开场标签</span>
            <input value={settings.hero.introLabel} onChange={(event) => hero("introLabel", event.target.value)} />
          </label>
          <label>
            <span>持续时间</span>
            <span className="input-with-suffix">
              <input type="number" min={1200} max={8000} step={100} value={settings.hero.introDuration} onChange={(event) => hero("introDuration", Number(event.target.value))} />
              <i>毫秒</i>
            </span>
          </label>
          <label className="wide">
            <span>开场文案</span>
            <textarea rows={4} value={settings.hero.introLines.join("\n")} onChange={(event) => hero("introLines", event.target.value.split("\n").filter(Boolean))} />
            <small>每行依次出现，最多四行。</small>
          </label>
          <label>
            <span>跳过按钮文案</span>
            <input value={settings.hero.introSkipLabel} onChange={(event) => hero("introSkipLabel", event.target.value)} />
          </label>
        </div>
      </section>

      <section className="studio-form-section" aria-labelledby="daily-settings-title">
        <header><p className="eyebrow">DAILY SIGNAL</p><h2 id="daily-settings-title">每日策展与访客回应</h2></header>
        <div className="studio-form-grid">
          <label>
            <span>时区</span>
            <input value={settings.daily.timeZone} onChange={(event) => daily("timeZone", event.target.value)} />
          </label>
          <label>
            <span>眉题</span>
            <input value={settings.daily.eyebrow} onChange={(event) => daily("eyebrow", event.target.value)} />
          </label>
          <label className="wide">
            <span>每日标题</span>
            <input value={settings.daily.titleTemplate} onChange={(event) => daily("titleTemplate", event.target.value)} />
            <small>可以使用 {"{tag}"} 与 {"{date}"} 占位符。</small>
          </label>
          <label className="wide">
            <span>策展说明</span>
            <textarea rows={3} value={settings.daily.description} onChange={(event) => daily("description", event.target.value)} />
          </label>
          <label>
            <span>文章标签</span>
            <input value={settings.daily.articleLabel} onChange={(event) => daily("articleLabel", event.target.value)} />
          </label>
          <label>
            <span>项目标签</span>
            <input value={settings.daily.projectLabel} onChange={(event) => daily("projectLabel", event.target.value)} />
          </label>
          <label>
            <span>回访提示</span>
            <input value={settings.daily.visitTemplate} onChange={(event) => daily("visitTemplate", event.target.value)} />
            <small>使用 {"{count}"} 显示这台设备的回访次数。</small>
          </label>
          <label>
            <span>访客提问</span>
            <input value={settings.daily.prompt} onChange={(event) => daily("prompt", event.target.value)} />
          </label>
          <label>
            <span>上午问候</span>
            <input value={settings.daily.greetings.morning} onChange={(event) => greeting("morning", event.target.value)} />
          </label>
          <label>
            <span>下午问候</span>
            <input value={settings.daily.greetings.afternoon} onChange={(event) => greeting("afternoon", event.target.value)} />
          </label>
          <label>
            <span>晚间问候</span>
            <input value={settings.daily.greetings.evening} onChange={(event) => greeting("evening", event.target.value)} />
          </label>
          <label>
            <span>重新选择文案</span>
            <input value={settings.daily.resetLabel} onChange={(event) => daily("resetLabel", event.target.value)} />
          </label>
        </div>
        <div className="studio-daily-modes">
          {settings.daily.modes.map((mode, index) => (
            <fieldset key={mode.id}>
              <legend>回应 {String(index + 1).padStart(2, "0")}</legend>
              <label><span>状态名称</span><input value={mode.label} onChange={(event) => dailyMode(index, "label", event.target.value)} /></label>
              <label><span>回应内容</span><textarea rows={3} value={mode.reply} onChange={(event) => dailyMode(index, "reply", event.target.value)} /></label>
              <label><span>推荐目标</span><select value={mode.target} onChange={(event) => dailyMode(index, "target", event.target.value)}><option value="article">今日文章</option><option value="project">今日项目</option><option value="play">知识星图</option></select></label>
              <label><span>操作文案</span><input value={mode.actionLabel} onChange={(event) => dailyMode(index, "actionLabel", event.target.value)} /></label>
            </fieldset>
          ))}
        </div>
      </section>

      <section className="studio-form-section" aria-labelledby="engagement-settings-title">
        <header><p className="eyebrow">READER SIGNAL</p><h2 id="engagement-settings-title">文章回应</h2></header>
        <div className="studio-form-grid">
          <label className="studio-check wide">
            <input type="checkbox" checked={settings.engagement.enabled} onChange={(event) => engagement("enabled", event.target.checked)} />
            <span>在文章末尾显示匿名回应</span>
          </label>
          <label>
            <span>眉题</span>
            <input value={settings.engagement.eyebrow} onChange={(event) => engagement("eyebrow", event.target.value)} />
          </label>
          <label>
            <span>标题</span>
            <input value={settings.engagement.title} onChange={(event) => engagement("title", event.target.value)} />
          </label>
          <label className="wide">
            <span>说明</span>
            <textarea rows={3} value={settings.engagement.description} onChange={(event) => engagement("description", event.target.value)} />
          </label>
          <label>
            <span>加载提示</span>
            <input value={settings.engagement.loadingLabel} onChange={(event) => engagement("loadingLabel", event.target.value)} />
          </label>
          <label>
            <span>错误提示</span>
            <input value={settings.engagement.errorMessage} onChange={(event) => engagement("errorMessage", event.target.value)} />
          </label>
          <label>
            <span>重试文案</span>
            <input value={settings.engagement.retryLabel} onChange={(event) => engagement("retryLabel", event.target.value)} />
          </label>
          <label>
            <span>统计文案</span>
            <input value={settings.engagement.totalTemplate} onChange={(event) => engagement("totalTemplate", event.target.value)} />
            <small>使用 {"{count}"} 显示真实回应数。</small>
          </label>
          <label>
            <span>感谢文案</span>
            <input value={settings.engagement.thanksTemplate} onChange={(event) => engagement("thanksTemplate", event.target.value)} />
            <small>使用 {"{reaction}"} 显示访客选择。</small>
          </label>
          <label className="wide">
            <span>隐私说明</span>
            <textarea rows={2} value={settings.engagement.privacyNote} onChange={(event) => engagement("privacyNote", event.target.value)} />
          </label>
          <label>
            <span>撤回文案</span>
            <input value={settings.engagement.removeLabel} onChange={(event) => engagement("removeLabel", event.target.value)} />
          </label>
          <label>
            <span>撤回结果</span>
            <input value={settings.engagement.removedMessage} onChange={(event) => engagement("removedMessage", event.target.value)} />
          </label>
        </div>
        <div className="studio-daily-modes">
          {settings.engagement.options.map((option, index) => (
            <fieldset key={`${index}-${option.id}`}>
              <legend>回应选项 {String(index + 1).padStart(2, "0")}</legend>
              <label><span>稳定 ID</span><input value={option.id} onChange={(event) => reactionOption(index, "id", event.target.value)} /></label>
              <label><span>短标签</span><input value={option.label} onChange={(event) => reactionOption(index, "label", event.target.value)} /></label>
              <label><span>符号</span><input value={option.symbol} onChange={(event) => reactionOption(index, "symbol", event.target.value)} /></label>
              <label><span>选择后的回应</span><textarea rows={3} value={option.reply} onChange={(event) => reactionOption(index, "reply", event.target.value)} /></label>
              <button
                className="studio-inline-action danger"
                type="button"
                disabled={settings.engagement.options.length <= 2}
                onClick={() => removeReactionOption(index)}
              >
                移除此选项
              </button>
            </fieldset>
          ))}
        </div>
        <button
          className="studio-inline-action"
          type="button"
          disabled={settings.engagement.options.length >= 6}
          onClick={addReactionOption}
        >
          ＋ 添加回应选项
        </button>
        <p className="studio-help">回应 ID 用于关联真实统计；更改或移除 ID 后，保存会清理对应的历史回应。</p>
      </section>

      <section className="studio-form-section" aria-labelledby="algorithm-settings-title">
        <header>
          <p className="eyebrow">ALGORITHM NOTEBOOK</p>
          <h2 id="algorithm-settings-title">题库界面文案</h2>
        </header>
        <div className="studio-form-grid">
          <label>
            <span>页面眉题</span>
            <input
              value={settings.algorithms.page.eyebrow}
              onChange={(event) => algorithmPage("eyebrow", event.target.value)}
            />
          </label>
          <label>
            <span>页面标题</span>
            <input
              value={settings.algorithms.page.title}
              onChange={(event) => algorithmPage("title", event.target.value)}
            />
          </label>
          <label className="wide">
            <span>页面说明</span>
            <textarea
              rows={3}
              value={settings.algorithms.page.description}
              onChange={(event) => algorithmPage("description", event.target.value)}
            />
          </label>
          <label>
            <span>搜索提示</span>
            <input
              value={settings.algorithms.hub.searchPlaceholder}
              onChange={(event) => algorithmHub("searchPlaceholder", event.target.value)}
            />
          </label>
          <label>
            <span>结果数量模板</span>
            <input
              value={settings.algorithms.hub.resultTemplate}
              onChange={(event) => algorithmHub("resultTemplate", event.target.value)}
            />
            <small>使用 {"{count}"} 显示真实数量。</small>
          </label>
          <label>
            <span>简单难度</span>
            <input
              value={settings.algorithms.hub.difficultyLabels.easy}
              onChange={(event) => algorithmDifficulty("easy", event.target.value)}
            />
          </label>
          <label>
            <span>中等难度</span>
            <input
              value={settings.algorithms.hub.difficultyLabels.medium}
              onChange={(event) => algorithmDifficulty("medium", event.target.value)}
            />
          </label>
          <label>
            <span>困难难度</span>
            <input
              value={settings.algorithms.hub.difficultyLabels.hard}
              onChange={(event) => algorithmDifficulty("hard", event.target.value)}
            />
          </label>
          <label>
            <span>解法数量模板</span>
            <input
              value={settings.algorithms.hub.solutionCountTemplate}
              onChange={(event) => algorithmHub("solutionCountTemplate", event.target.value)}
            />
            <small>使用 {"{count}"} 显示真实数量。</small>
          </label>
          <label>
            <span>题意标题</span>
            <input
              value={settings.algorithms.hub.statementTitle}
              onChange={(event) => algorithmHub("statementTitle", event.target.value)}
            />
          </label>
          <label>
            <span>约束标题</span>
            <input
              value={settings.algorithms.hub.constraintsTitle}
              onChange={(event) => algorithmHub("constraintsTitle", event.target.value)}
            />
          </label>
          <label>
            <span>核心直觉标题</span>
            <input
              value={settings.algorithms.hub.intuitionTitle}
              onChange={(event) => algorithmHub("intuitionTitle", event.target.value)}
            />
          </label>
          <label>
            <span>解法总览标题</span>
            <input
              value={settings.algorithms.hub.overviewTitle}
              onChange={(event) => algorithmHub("overviewTitle", event.target.value)}
            />
          </label>
          <label>
            <span>解法列标签</span>
            <input
              value={settings.algorithms.hub.approachLabel}
              onChange={(event) => algorithmHub("approachLabel", event.target.value)}
            />
          </label>
          <label>
            <span>语言实现列标签</span>
            <input
              value={settings.algorithms.hub.implementationsLabel}
              onChange={(event) => algorithmHub("implementationsLabel", event.target.value)}
            />
          </label>
          <label>
            <span>推导步骤标题</span>
            <input
              value={settings.algorithms.hub.stepsTitle}
              onChange={(event) => algorithmHub("stepsTitle", event.target.value)}
            />
          </label>
          <label>
            <span>正确性标题</span>
            <input
              value={settings.algorithms.hub.proofTitle}
              onChange={(event) => algorithmHub("proofTitle", event.target.value)}
            />
          </label>
          <label>
            <span>复杂度标题</span>
            <input
              value={settings.algorithms.hub.complexityTitle}
              onChange={(event) => algorithmHub("complexityTitle", event.target.value)}
            />
          </label>
          <label>
            <span>易错点标题</span>
            <input
              value={settings.algorithms.hub.pitfallsTitle}
              onChange={(event) => algorithmHub("pitfallsTitle", event.target.value)}
            />
          </label>
          <label>
            <span>复制按钮</span>
            <input
              value={settings.algorithms.hub.copyLabel}
              onChange={(event) => algorithmHub("copyLabel", event.target.value)}
            />
          </label>
          <label>
            <span>复制成功提示</span>
            <input
              value={settings.algorithms.hub.copiedLabel}
              onChange={(event) => algorithmHub("copiedLabel", event.target.value)}
            />
          </label>
          <label>
            <span>复制失败提示</span>
            <input
              value={settings.algorithms.hub.copyErrorLabel}
              onChange={(event) => algorithmHub("copyErrorLabel", event.target.value)}
            />
          </label>
          <label>
            <span>参考资料标题</span>
            <input
              value={settings.algorithms.hub.referencesTitle}
              onChange={(event) => algorithmHub("referencesTitle", event.target.value)}
            />
          </label>
          <label>
            <span>引用作者标签</span>
            <input
              value={settings.algorithms.hub.referenceAuthorLabel}
              onChange={(event) => algorithmHub("referenceAuthorLabel", event.target.value)}
            />
          </label>
          <label>
            <span>访问日期标签</span>
            <input
              value={settings.algorithms.hub.referenceAccessedLabel}
              onChange={(event) => algorithmHub("referenceAccessedLabel", event.target.value)}
            />
          </label>
          <label>
            <span>全文参考标签</span>
            <input
              value={settings.algorithms.hub.referenceGeneralLabel}
              onChange={(event) => algorithmHub("referenceGeneralLabel", event.target.value)}
            />
          </label>
          <label className="wide">
            <span>空题库说明</span>
            <textarea
              rows={3}
              value={settings.algorithms.hub.emptyDescription}
              onChange={(event) => algorithmHub("emptyDescription", event.target.value)}
            />
          </label>
        </div>
        <p className="studio-help">
          题目、题解与代码由题库编辑器管理；这里仅负责访客看到的界面语言。
        </p>

        <div className="studio-subsection">
          <header>
            <p className="eyebrow">AUTHORING PRESETS</p>
            <h3>题解创作预设</h3>
          </header>
          <div className="studio-form-grid">
            <label>
              <span>默认平台</span>
              <select
                value={settings.algorithms.authoring.defaultPlatformId}
                onChange={(event) => algorithmAuthoring("defaultPlatformId", event.target.value)}
              >
                {settings.algorithms.authoring.platformPresets.map((preset) => (
                  <option key={preset.id} value={preset.id}>{preset.label || preset.id}</option>
                ))}
              </select>
            </label>
            <label className="wide">
              <span>LaTeX 输入帮助</span>
              <textarea
                rows={3}
                value={settings.algorithms.authoring.latexHelp}
                onChange={(event) => algorithmAuthoring("latexHelp", event.target.value)}
              />
            </label>
            <label className="wide">
              <span>引用输入帮助</span>
              <textarea
                rows={3}
                value={settings.algorithms.authoring.referenceHelp}
                onChange={(event) => algorithmAuthoring("referenceHelp", event.target.value)}
              />
            </label>
          </div>

          <div className="studio-option-grid">
            {settings.algorithms.authoring.platformPresets.map((preset, index) => (
              <fieldset key={`${index}-${preset.id}`}>
                <legend>平台 {String(index + 1).padStart(2, "0")}</legend>
                <label><span>稳定 ID</span><input value={preset.id} onChange={(event) => platformPreset(index, "id", event.target.value)} /></label>
                <label><span>显示名称</span><input value={preset.label} onChange={(event) => platformPreset(index, "label", event.target.value)} /></label>
                <label><span>原题链接提示</span><input value={preset.sourceHint} onChange={(event) => platformPreset(index, "sourceHint", event.target.value)} /></label>
                <button
                  className="studio-inline-action danger"
                  type="button"
                  disabled={
                    settings.algorithms.authoring.platformPresets.length <= 1 ||
                    settings.algorithms.authoring.defaultPlatformId === preset.id
                  }
                  onClick={() => removePlatformPreset(index)}
                >
                  移除此平台
                </button>
              </fieldset>
            ))}
          </div>
          <button
            className="studio-inline-action"
            type="button"
            disabled={settings.algorithms.authoring.platformPresets.length >= 12}
            onClick={addPlatformPreset}
          >
            ＋ 添加平台预设
          </button>

          <div className="studio-option-grid">
            {settings.algorithms.authoring.languagePresets.map((preset, index) => (
              <fieldset key={`${index}-${preset.id}`}>
                <legend>语言 {String(index + 1).padStart(2, "0")}</legend>
                <label><span>语言 ID</span><input value={preset.id} onChange={(event) => languagePreset(index, "id", event.target.value)} /></label>
                <label><span>显示名称</span><input value={preset.label} onChange={(event) => languagePreset(index, "label", event.target.value)} /></label>
                <button
                  className="studio-inline-action danger"
                  type="button"
                  disabled={settings.algorithms.authoring.languagePresets.length <= 1}
                  onClick={() => removeLanguagePreset(index)}
                >
                  移除此语言
                </button>
              </fieldset>
            ))}
          </div>
          <button
            className="studio-inline-action"
            type="button"
            disabled={settings.algorithms.authoring.languagePresets.length >= 16}
            onClick={addLanguagePreset}
          >
            ＋ 添加语言预设
          </button>
        </div>
      </section>

      <section className="studio-form-section" aria-labelledby="theme-settings-title">
        <header><p className="eyebrow">THEME</p><h2 id="theme-settings-title">主题强调色</h2></header>
        <div className="studio-color-grid">
          <label>
            <span>深色主题</span>
            <div><input type="color" value={settings.theme.darkAccent} onChange={(event) => theme("darkAccent", event.target.value)} /><input value={settings.theme.darkAccent} onChange={(event) => theme("darkAccent", event.target.value)} /></div>
          </label>
          <label>
            <span>浅色主题</span>
            <div><input type="color" value={settings.theme.lightAccent} onChange={(event) => theme("lightAccent", event.target.value)} /><input value={settings.theme.lightAccent} onChange={(event) => theme("lightAccent", event.target.value)} /></div>
          </label>
        </div>
        <p className="studio-help">保存时会验证颜色格式；正文与背景的可读性仍由固定中性色令牌保证。</p>
      </section>
      </fieldset>
    </form>
  );
}
