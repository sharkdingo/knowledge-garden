CREATE TABLE `algorithm_code_blocks` (
	`id` text PRIMARY KEY NOT NULL,
	`solution_id` text NOT NULL,
	`language` text NOT NULL,
	`label` text NOT NULL,
	`code` text NOT NULL,
	`sort_order` integer NOT NULL,
	FOREIGN KEY (`solution_id`) REFERENCES `algorithm_solutions`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `algorithm_code_blocks_solution_order_idx` ON `algorithm_code_blocks` (`solution_id`,`sort_order`);--> statement-breakpoint
CREATE TABLE `algorithm_problem_tags` (
	`problem_slug` text NOT NULL,
	`tag_id` text NOT NULL,
	PRIMARY KEY(`problem_slug`, `tag_id`),
	FOREIGN KEY (`problem_slug`) REFERENCES `algorithm_problems`(`slug`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`tag_id`) REFERENCES `tags`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `algorithm_problems` (
	`slug` text PRIMARY KEY NOT NULL,
	`platform` text NOT NULL,
	`problem_id` text NOT NULL,
	`title` text NOT NULL,
	`difficulty` text NOT NULL,
	`source_url` text NOT NULL,
	`summary` text NOT NULL,
	`statement` text NOT NULL,
	`constraints` text NOT NULL,
	`status` text DEFAULT 'draft' NOT NULL,
	`solved_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`featured` integer DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE INDEX `algorithm_problems_status_solved_idx` ON `algorithm_problems` (`status`,`solved_at`);--> statement-breakpoint
CREATE INDEX `algorithm_problems_platform_id_idx` ON `algorithm_problems` (`platform`,`problem_id`);--> statement-breakpoint
CREATE TABLE `algorithm_solutions` (
	`id` text PRIMARY KEY NOT NULL,
	`problem_slug` text NOT NULL,
	`title` text NOT NULL,
	`intuition` text NOT NULL,
	`steps` text NOT NULL,
	`proof` text NOT NULL,
	`time_complexity` text NOT NULL,
	`space_complexity` text NOT NULL,
	`pitfalls` text NOT NULL,
	`sort_order` integer NOT NULL,
	FOREIGN KEY (`problem_slug`) REFERENCES `algorithm_problems`(`slug`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `algorithm_solutions_problem_order_idx` ON `algorithm_solutions` (`problem_slug`,`sort_order`);--> statement-breakpoint
UPDATE `site_settings`
SET
  `value` = json_set(
    `value`,
    '$.pages.algorithms',
    json('{
      "eyebrow": "ALGORITHM / FIELD NOTES",
      "title": "算法题库",
      "description": "不只保存通过的代码，也保存从题意、约束到正确解法的推导路径。"
    }'),
    '$.algorithmHub',
    json('{
      "archiveTitle": "题解列表",
      "statsLabel": "题库统计",
      "publishedStatLabel": "已发布",
      "solutionsStatLabel": "解法",
      "languagesStatLabel": "语言",
      "searchPlaceholder": "搜索题号、标题、算法或平台…",
      "difficultyFilterLabel": "按难度筛选",
      "platformFilterLabel": "按平台筛选",
      "allDifficultiesLabel": "全部难度",
      "allPlatformsLabel": "全部平台",
      "resultTemplate": "{count} 条题解",
      "noResultsTitle": "没有匹配的题解",
      "clearFiltersLabel": "清除筛选",
      "emptyTitle": "题库正在等待第一条真实记录",
      "emptyDescription": "在内容工作室中创建并发布题解后，它会出现在这里；系统不会用示例数据填充空白。",
      "difficultyLabels": {
        "easy": "简单",
        "medium": "中等",
        "hard": "困难"
      },
      "solutionCountTemplate": "{count} 种解法",
      "sourceLabel": "查看原题",
      "solvedLabel": "完成于",
      "hubLabel": "题库",
      "missingTitle": "题解未找到",
      "problemEyebrow": "PROBLEM",
      "approachesEyebrow": "APPROACHES",
      "tocLabel": "本页目录",
      "statementTitle": "题意重述",
      "constraintsTitle": "约束与边界",
      "solutionsTitle": "解法",
      "intuitionTitle": "核心直觉",
      "stepsTitle": "推导步骤",
      "proofTitle": "正确性说明",
      "complexityTitle": "复杂度",
      "timeLabel": "时间",
      "spaceLabel": "空间",
      "pitfallsTitle": "易错点",
      "codeTitle": "实现",
      "codeLanguageLabel": "选择代码语言",
      "codeRegionTemplate": "{language} 代码",
      "copyLabel": "复制代码",
      "copiedLabel": "已复制"
    }')
  ),
  `updated_at` = CURRENT_TIMESTAMP
WHERE `key` = 'profile';--> statement-breakpoint
INSERT INTO `navigation_items` (`id`, `location`, `href`, `label`, `sort_order`) VALUES
  ('algorithms', 'header', '/problems', '题库', 25),
  ('footer-algorithms', 'footer', '/problems', '题库', 15);
