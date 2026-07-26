CREATE TABLE `article_reactions` (
	`article_slug` text NOT NULL,
	`visitor_key` text NOT NULL,
	`reaction_id` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	PRIMARY KEY(`article_slug`, `visitor_key`),
	FOREIGN KEY (`article_slug`) REFERENCES `articles`(`slug`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `article_reactions_article_reaction_idx` ON `article_reactions` (`article_slug`,`reaction_id`);--> statement-breakpoint
CREATE INDEX `article_reactions_updated_idx` ON `article_reactions` (`updated_at`);--> statement-breakpoint
UPDATE `site_settings`
SET
  `value` = json_set(
    `value`,
    '$.engagement',
    json('{
      "enabled": true,
      "eyebrow": "READER SIGNAL",
      "title": "这篇文字在你这里留下了什么？",
      "description": "选一个最接近此刻的回应。它会成为真实统计，也能帮助我决定接下来把什么写得更深。",
      "loadingLabel": "正在读取其他访客的回应…",
      "errorMessage": "回应暂时没有送达，请稍后再试。",
      "retryLabel": "重新连接",
      "totalTemplate": "已有 {count} 次真实回应",
      "thanksTemplate": "收到你的「{reaction}」。谢谢你把阅读变成一次交流。",
      "privacyNote": "不收集姓名或联系方式；只在这台设备保存一个匿名标识，用于修改自己的选择。",
      "removeLabel": "撤回我的回应",
      "removedMessage": "你的回应已撤回。",
      "options": [
        {
          "id": "linger",
          "label": "值得慢想",
          "symbol": "◌",
          "reply": "愿它在你接下来的某个时刻，再长出一点新的理解。"
        },
        {
          "id": "clearer",
          "label": "更清楚了",
          "symbol": "↗",
          "reply": "清楚不是终点，但它让下一步变得可以抵达。"
        },
        {
          "id": "continue",
          "label": "想继续聊",
          "symbol": "···",
          "reply": "这条信号会被带回内容工作室，成为下一篇文章的线索。"
        },
        {
          "id": "try-it",
          "label": "我要试试",
          "symbol": "◇",
          "reply": "太好了。真正的理解，往往从一次小小的实践开始。"
        }
      ]
    }')
  ),
  `updated_at` = CURRENT_TIMESTAMP
WHERE `key` = 'profile';
