CREATE TABLE `site_editors` (
	`email` text PRIMARY KEY NOT NULL,
	`display_name` text NOT NULL,
	`created_at` text NOT NULL
);--> statement-breakpoint

UPDATE `site_settings`
SET
  `value` = json_set(
    `value`,
    '$.hero.intro',
    json('{"enabled":true,"label":"KNOWLEDGE GARDEN / INITIALIZING","lines":["正在连接知识节点","正在展开个人坐标","欢迎进入sharkdingo的数字花园"],"skipLabel":"跳过开场","duration":2600}')
  ),
  `updated_at` = '2026-07-23T08:00:00Z'
WHERE `key` = 'profile';
