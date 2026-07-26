DELETE FROM `algorithm_references`;--> statement-breakpoint
DELETE FROM `algorithm_code_blocks`;--> statement-breakpoint
DELETE FROM `algorithm_problem_tags`;--> statement-breakpoint
DELETE FROM `algorithm_solutions`;--> statement-breakpoint
DELETE FROM `algorithm_problems`;--> statement-breakpoint
DELETE FROM `article_reactions`;--> statement-breakpoint
DELETE FROM `article_drafts`;--> statement-breakpoint
DELETE FROM `article_revisions`;--> statement-breakpoint
DELETE FROM `projects`;--> statement-breakpoint
DELETE FROM `article_tags`;--> statement-breakpoint
DELETE FROM `article_sections`;--> statement-breakpoint
DELETE FROM `articles`;--> statement-breakpoint
DELETE FROM `tags`;--> statement-breakpoint
DELETE FROM `categories`;--> statement-breakpoint

UPDATE `site_settings`
SET
  `value` = json_set(
    `value`,
    '$.identity.name', 'sharkdingo 的知识花园',
    '$.identity.shortName', 'sharkdingo',
    '$.identity.latinName', 'sharkdingo',
    '$.identity.author', 'sharkdingo',
    '$.footer.statement', '© 2026 sharkdingo · 在持续学习中构建。',
    '$.hero.eyebrow', 'SHARKDINGO / KNOWLEDGE GARDEN',
    '$.hero.lead', '我是 sharkdingo，一名关注软件架构、AI 工作流与 IoT 的开发者。这里保存问题如何被理解、系统如何被构建。',
    '$.hero.nowValue', '持续构建中',
    '$.hero.intro.lines', json('["正在连接知识节点","正在展开个人坐标","欢迎进入 sharkdingo 的数字花园"]'),
    '$.about.name', 'sharkdingo',
    '$.playground.constellation.emptyTitle', '知识星图正在等待第一篇文章',
    '$.playground.constellation.emptyDescription', '发布带有标签的真实文章后，星图会自动从内容关系中生成；空白不会由示例数据填充。'
  ),
  `updated_at` = CURRENT_TIMESTAMP
WHERE `key` = 'profile';--> statement-breakpoint

DROP TABLE `site_editors`;
