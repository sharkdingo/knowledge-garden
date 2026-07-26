CREATE TABLE `algorithm_references` (
	`id` text PRIMARY KEY NOT NULL,
	`problem_slug` text NOT NULL,
	`solution_id` text,
	`title` text NOT NULL,
	`author` text NOT NULL,
	`url` text NOT NULL,
	`note` text NOT NULL,
	`accessed_at` text NOT NULL,
	`sort_order` integer NOT NULL,
	FOREIGN KEY (`problem_slug`) REFERENCES `algorithm_problems`(`slug`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`solution_id`) REFERENCES `algorithm_solutions`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `algorithm_references_problem_order_idx` ON `algorithm_references` (`problem_slug`,`sort_order`);--> statement-breakpoint
CREATE INDEX `algorithm_references_solution_idx` ON `algorithm_references` (`solution_id`);
--> statement-breakpoint
UPDATE `site_settings`
SET
  `value` = json_set(
    `value`,
    '$.algorithmHub.implementationsLabel', '语言实现',
    '$.algorithmHub.referencesTitle', '参考与致谢',
    '$.algorithmHub.referenceAuthorLabel', '作者',
    '$.algorithmHub.referenceAccessedLabel', '访问于',
    '$.algorithmHub.referenceGeneralLabel', '全文参考',
    '$.algorithmAuthoring', json('{
      "defaultPlatformId": "leetcode",
      "platformPresets": [
        {
          "id": "leetcode",
          "label": "LeetCode",
          "sourceHint": "https://leetcode.cn/problems/problem-slug/"
        }
      ],
      "languagePresets": [
        { "id": "cpp", "label": "C++" },
        { "id": "java", "label": "Java" },
        { "id": "python", "label": "Python" },
        { "id": "typescript", "label": "TypeScript" }
      ],
      "latexHelp": "行内公式使用 $...$，独立公式使用 $$...$$。例如 $O(n \\log n)$。",
      "referenceHelp": "引用他人思路时请填写作者、标题、原链接、访问日期，并说明借鉴范围。"
    }')
  ),
  `updated_at` = '2026-07-26T11:30:00Z'
WHERE `key` = 'profile';
