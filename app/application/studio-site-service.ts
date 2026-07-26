import type {
  StudioSiteRepository,
  StudioSiteSettings,
} from "../domain/studio";
import { StudioValidationError } from "./studio-validation";

const COLOR = /^#[0-9a-f]{6}$/i;
const IDENTIFIER = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function text(value: unknown, label: string, max: number): string {
  const normalized = typeof value === "string" ? value.trim() : "";
  if (!normalized) throw new StudioValidationError(`${label}不能为空。`);
  if (normalized.length > max) {
    throw new StudioValidationError(`${label}不能超过 ${max} 个字符。`);
  }
  return normalized;
}

function relativeHref(value: unknown, label: string): string {
  const normalized = typeof value === "string" ? value.trim() : "";
  if (!normalized.startsWith("/") || normalized.startsWith("//")) {
    throw new StudioValidationError(`${label}必须是站内路径。`);
  }
  return normalized;
}

export class StudioSiteService {
  constructor(private readonly repository: StudioSiteRepository) {}

  getSettings() {
    return this.repository.getEditableSiteSettings();
  }

  async update(settings: StudioSiteSettings) {
    if (
      !settings ||
      !settings.hero ||
      !settings.home ||
      !settings.daily ||
      !settings.daily.greetings ||
      !Array.isArray(settings.daily.modes) ||
      !settings.engagement ||
      !Array.isArray(settings.engagement.options) ||
      !settings.algorithms ||
      !settings.algorithms.page ||
      !settings.algorithms.hub ||
      !settings.algorithms.hub.difficultyLabels ||
      !settings.algorithms.authoring ||
      !Array.isArray(settings.algorithms.authoring.platformPresets) ||
      !Array.isArray(settings.algorithms.authoring.languagePresets) ||
      !settings.theme ||
      !Array.isArray(settings.hero.titleLines) ||
      !Array.isArray(settings.hero.introLines)
    ) {
      throw new StudioValidationError("站点设置结构不完整，请刷新页面后重试。");
    }
    if (!COLOR.test(settings.theme.darkAccent) || !COLOR.test(settings.theme.lightAccent)) {
      throw new StudioValidationError("主题强调色必须是六位十六进制颜色。");
    }
    if (
      !Number.isInteger(settings.hero.introDuration) ||
      settings.hero.introDuration < 1200 ||
      settings.hero.introDuration > 8000
    ) {
      throw new StudioValidationError("开场时长需要在 1.2–8 秒之间。");
    }
    try {
      new Intl.DateTimeFormat("zh-CN", { timeZone: settings.daily.timeZone }).format();
    } catch {
      throw new StudioValidationError("每日策展时区无效。");
    }
    const modeIds = new Set<string>();
    const modes = settings.daily.modes.slice(0, 6).map((mode, index) => {
      if (!mode || typeof mode !== "object") {
        throw new StudioValidationError(`第 ${index + 1} 个访客状态结构不完整。`);
      }
      const id = text(mode.id, `第 ${index + 1} 个访客状态 ID`, 60)
        .toLowerCase();
      if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id) || modeIds.has(id)) {
        throw new StudioValidationError(`第 ${index + 1} 个访客状态 ID 无效或重复。`);
      }
      if (!["article", "project", "play"].includes(mode.target)) {
        throw new StudioValidationError(`第 ${index + 1} 个访客回应目标无效。`);
      }
      modeIds.add(id);
      return {
        id,
        label: text(mode.label, `第 ${index + 1} 个访客状态`, 30),
        reply: text(mode.reply, `第 ${index + 1} 个回应`, 180),
        target: mode.target,
        actionLabel: text(mode.actionLabel, `第 ${index + 1} 个操作文案`, 40),
      };
    });
    if (!modes.length) throw new StudioValidationError("访客回应至少需要一个状态。");
    if (settings.engagement.options.length < 2 || settings.engagement.options.length > 6) {
      throw new StudioValidationError("文章回应需要设置 2–6 个选项。");
    }
    const reactionIds = new Set<string>();
    const reactionOptions = settings.engagement.options.map((option, index) => {
      if (!option || typeof option !== "object") {
        throw new StudioValidationError(`第 ${index + 1} 个文章回应结构不完整。`);
      }
      const id = text(option.id, `第 ${index + 1} 个文章回应 ID`, 60)
        .toLowerCase();
      if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id) || reactionIds.has(id)) {
        throw new StudioValidationError(`第 ${index + 1} 个文章回应 ID 无效或重复。`);
      }
      reactionIds.add(id);
      return {
        id,
        label: text(option.label, `第 ${index + 1} 个文章回应`, 30),
        symbol: text(option.symbol, `第 ${index + 1} 个文章回应符号`, 6),
        reply: text(option.reply, `第 ${index + 1} 个文章回应反馈`, 180),
      };
    });
    if (
      settings.algorithms.authoring.platformPresets.length < 1 ||
      settings.algorithms.authoring.platformPresets.length > 12
    ) {
      throw new StudioValidationError("题目平台预设需要设置 1–12 个选项。");
    }
    if (
      settings.algorithms.authoring.languagePresets.length < 1 ||
      settings.algorithms.authoring.languagePresets.length > 16
    ) {
      throw new StudioValidationError("代码语言预设需要设置 1–16 个选项。");
    }
    const platformIds = new Set<string>();
    const platformPresets = settings.algorithms.authoring.platformPresets.map((preset, index) => {
      if (!preset || typeof preset !== "object") {
        throw new StudioValidationError(`第 ${index + 1} 个平台预设结构不完整。`);
      }
      const id = text(preset.id, `第 ${index + 1} 个平台 ID`, 60)
        .toLowerCase();
      if (!IDENTIFIER.test(id) || platformIds.has(id)) {
        throw new StudioValidationError(`第 ${index + 1} 个平台 ID 无效或重复。`);
      }
      platformIds.add(id);
      return {
        id,
        label: text(preset.label, `第 ${index + 1} 个平台名称`, 80),
        sourceHint: text(preset.sourceHint, `第 ${index + 1} 个平台链接提示`, 240),
      };
    });
    const defaultPlatformId = text(
      settings.algorithms.authoring.defaultPlatformId,
      "默认题目平台",
      60,
    ).toLowerCase();
    if (!platformIds.has(defaultPlatformId)) {
      throw new StudioValidationError("默认题目平台必须来自平台预设。");
    }
    const languageIds = new Set<string>();
    const languagePresets = settings.algorithms.authoring.languagePresets.map((preset, index) => {
      if (!preset || typeof preset !== "object") {
        throw new StudioValidationError(`第 ${index + 1} 个语言预设结构不完整。`);
      }
      const id = text(preset.id, `第 ${index + 1} 个语言 ID`, 60)
        .toLowerCase();
      if (!IDENTIFIER.test(id) || languageIds.has(id)) {
        throw new StudioValidationError(`第 ${index + 1} 个语言 ID 无效或重复。`);
      }
      languageIds.add(id);
      return {
        id,
        label: text(preset.label, `第 ${index + 1} 个语言名称`, 80),
      };
    });
    const normalized: StudioSiteSettings = {
      hero: {
        eyebrow: text(settings.hero.eyebrow, "眉题", 80),
        titleLines: settings.hero.titleLines.map((line) => text(line, "主标题", 80)).slice(0, 3),
        lead: text(settings.hero.lead, "首页导语", 320),
        caption: text(settings.hero.caption, "图片说明", 160),
        nowLabel: text(settings.hero.nowLabel, "当前状态标签", 60),
        nowValue: text(settings.hero.nowValue, "当前状态", 160),
        primaryLabel: text(settings.hero.primaryLabel, "主要操作文案", 40),
        primaryHref: relativeHref(settings.hero.primaryHref, "主要操作链接"),
        secondaryLabel: text(settings.hero.secondaryLabel, "次要操作文案", 40),
        secondaryHref: relativeHref(settings.hero.secondaryHref, "次要操作链接"),
        introEnabled: Boolean(settings.hero.introEnabled),
        introLabel: text(settings.hero.introLabel, "开场标签", 80),
        introLines: settings.hero.introLines.map((line) => text(line, "开场文案", 100)).slice(0, 4),
        introSkipLabel: text(settings.hero.introSkipLabel, "跳过按钮文案", 30),
        introDuration: settings.hero.introDuration,
      },
      home: {
        eyebrow: text(settings.home.eyebrow, "首页导览眉题", 80),
        title: text(settings.home.title, "首页导览标题", 120),
        description: text(settings.home.description, "首页导览说明", 320),
        writingLabel: text(settings.home.writingLabel, "文章入口标签", 40),
        projectsLabel: text(settings.home.projectsLabel, "项目入口标签", 40),
        topicsLabel: text(settings.home.topicsLabel, "主题入口标签", 40),
        playgroundLabel: text(settings.home.playgroundLabel, "星图入口标签", 40),
        continueLabel: text(settings.home.continueLabel, "继续阅读标签", 60),
      },
      daily: {
        timeZone: settings.daily.timeZone.trim(),
        eyebrow: text(settings.daily.eyebrow, "每日策展眉题", 80),
        titleTemplate: text(settings.daily.titleTemplate, "每日策展标题", 140),
        description: text(settings.daily.description, "每日策展说明", 320),
        articleLabel: text(settings.daily.articleLabel, "每日文章标签", 40),
        projectLabel: text(settings.daily.projectLabel, "每日项目标签", 40),
        visitTemplate: text(settings.daily.visitTemplate, "回访提示", 100),
        prompt: text(settings.daily.prompt, "访客提问", 120),
        resetLabel: text(settings.daily.resetLabel, "重新选择文案", 30),
        greetings: {
          morning: text(settings.daily.greetings.morning, "上午问候", 40),
          afternoon: text(settings.daily.greetings.afternoon, "下午问候", 40),
          evening: text(settings.daily.greetings.evening, "晚间问候", 40),
        },
        modes,
      },
      engagement: {
        enabled: Boolean(settings.engagement.enabled),
        eyebrow: text(settings.engagement.eyebrow, "文章回应眉题", 80),
        title: text(settings.engagement.title, "文章回应标题", 120),
        description: text(settings.engagement.description, "文章回应说明", 320),
        loadingLabel: text(settings.engagement.loadingLabel, "文章回应加载文案", 80),
        errorMessage: text(settings.engagement.errorMessage, "文章回应错误文案", 100),
        retryLabel: text(settings.engagement.retryLabel, "文章回应重试文案", 40),
        totalTemplate: text(settings.engagement.totalTemplate, "文章回应总数文案", 100),
        thanksTemplate: text(settings.engagement.thanksTemplate, "文章回应感谢文案", 140),
        privacyNote: text(settings.engagement.privacyNote, "文章回应隐私说明", 240),
        removeLabel: text(settings.engagement.removeLabel, "撤回回应文案", 60),
        removedMessage: text(settings.engagement.removedMessage, "回应撤回结果", 80),
        options: reactionOptions,
      },
      algorithms: {
        page: {
          eyebrow: text(settings.algorithms.page.eyebrow, "题库眉题", 80),
          title: text(settings.algorithms.page.title, "题库标题", 120),
          description: text(settings.algorithms.page.description, "题库说明", 320),
        },
        hub: {
          archiveTitle: text(settings.algorithms.hub.archiveTitle, "题解列表名称", 80),
          statsLabel: text(settings.algorithms.hub.statsLabel, "题库统计辅助标签", 80),
          publishedStatLabel: text(settings.algorithms.hub.publishedStatLabel, "已发布统计标签", 30),
          solutionsStatLabel: text(settings.algorithms.hub.solutionsStatLabel, "解法统计标签", 30),
          languagesStatLabel: text(settings.algorithms.hub.languagesStatLabel, "语言统计标签", 30),
          searchPlaceholder: text(settings.algorithms.hub.searchPlaceholder, "题库搜索提示", 100),
          difficultyFilterLabel: text(settings.algorithms.hub.difficultyFilterLabel, "难度筛选标签", 80),
          platformFilterLabel: text(settings.algorithms.hub.platformFilterLabel, "平台筛选标签", 80),
          allDifficultiesLabel: text(settings.algorithms.hub.allDifficultiesLabel, "全部难度标签", 40),
          allPlatformsLabel: text(settings.algorithms.hub.allPlatformsLabel, "全部平台标签", 40),
          resultTemplate: text(settings.algorithms.hub.resultTemplate, "搜索结果模板", 80),
          noResultsTitle: text(settings.algorithms.hub.noResultsTitle, "无结果标题", 80),
          clearFiltersLabel: text(settings.algorithms.hub.clearFiltersLabel, "清除筛选标签", 40),
          emptyTitle: text(settings.algorithms.hub.emptyTitle, "空题库标题", 120),
          emptyDescription: text(settings.algorithms.hub.emptyDescription, "空题库说明", 320),
          difficultyLabels: {
            easy: text(settings.algorithms.hub.difficultyLabels.easy, "简单难度标签", 30),
            medium: text(settings.algorithms.hub.difficultyLabels.medium, "中等难度标签", 30),
            hard: text(settings.algorithms.hub.difficultyLabels.hard, "困难难度标签", 30),
          },
          solutionCountTemplate: text(settings.algorithms.hub.solutionCountTemplate, "解法数量模板", 80),
          sourceLabel: text(settings.algorithms.hub.sourceLabel, "原题链接标签", 40),
          solvedLabel: text(settings.algorithms.hub.solvedLabel, "完成日期标签", 40),
          hubLabel: text(settings.algorithms.hub.hubLabel, "题库面包屑标签", 40),
          missingTitle: text(settings.algorithms.hub.missingTitle, "题解不存在标题", 80),
          problemEyebrow: text(settings.algorithms.hub.problemEyebrow, "题意眉题", 40),
          approachesEyebrow: text(settings.algorithms.hub.approachesEyebrow, "解法眉题", 40),
          tocLabel: text(settings.algorithms.hub.tocLabel, "页内目录标签", 40),
          overviewTitle: text(settings.algorithms.hub.overviewTitle, "解法总览标题", 60),
          approachLabel: text(settings.algorithms.hub.approachLabel, "解法列标签", 40),
          implementationsLabel: text(settings.algorithms.hub.implementationsLabel, "语言实现列标签", 40),
          statementTitle: text(settings.algorithms.hub.statementTitle, "题意标题", 60),
          constraintsTitle: text(settings.algorithms.hub.constraintsTitle, "约束标题", 60),
          solutionsTitle: text(settings.algorithms.hub.solutionsTitle, "解法标题", 60),
          intuitionTitle: text(settings.algorithms.hub.intuitionTitle, "直觉标题", 60),
          stepsTitle: text(settings.algorithms.hub.stepsTitle, "步骤标题", 60),
          proofTitle: text(settings.algorithms.hub.proofTitle, "正确性标题", 60),
          complexityTitle: text(settings.algorithms.hub.complexityTitle, "复杂度标题", 60),
          timeLabel: text(settings.algorithms.hub.timeLabel, "时间复杂度标签", 40),
          spaceLabel: text(settings.algorithms.hub.spaceLabel, "空间复杂度标签", 40),
          pitfallsTitle: text(settings.algorithms.hub.pitfallsTitle, "易错点标题", 60),
          codeTitle: text(settings.algorithms.hub.codeTitle, "代码标题", 60),
          codeLanguageLabel: text(settings.algorithms.hub.codeLanguageLabel, "代码语言辅助标签", 80),
          codeRegionTemplate: text(settings.algorithms.hub.codeRegionTemplate, "代码区域模板", 80),
          copyLabel: text(settings.algorithms.hub.copyLabel, "复制代码标签", 40),
          copiedLabel: text(settings.algorithms.hub.copiedLabel, "复制成功标签", 40),
          copyErrorLabel: text(settings.algorithms.hub.copyErrorLabel, "复制失败标签", 80),
          referencesTitle: text(settings.algorithms.hub.referencesTitle, "参考资料标题", 60),
          referenceAuthorLabel: text(settings.algorithms.hub.referenceAuthorLabel, "引用作者标签", 40),
          referenceAccessedLabel: text(settings.algorithms.hub.referenceAccessedLabel, "引用访问日期标签", 40),
          referenceGeneralLabel: text(settings.algorithms.hub.referenceGeneralLabel, "全文参考标签", 40),
        },
        authoring: {
          defaultPlatformId,
          platformPresets,
          languagePresets,
          latexHelp: text(settings.algorithms.authoring.latexHelp, "LaTeX 输入帮助", 320),
          referenceHelp: text(settings.algorithms.authoring.referenceHelp, "引用输入帮助", 320),
        },
      },
      theme: {
        darkAccent: settings.theme.darkAccent.toLowerCase(),
        lightAccent: settings.theme.lightAccent.toLowerCase(),
      },
    };
    if (!normalized.hero.titleLines.length || !normalized.hero.introLines.length) {
      throw new StudioValidationError("主标题和开场文案至少需要一行。");
    }
    await this.repository.updateEditableSiteSettings(normalized);
  }
}
