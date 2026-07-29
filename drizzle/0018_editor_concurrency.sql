ALTER TABLE `articles` ADD `row_version` integer DEFAULT 1 NOT NULL;
--> statement-breakpoint
ALTER TABLE `articles` ADD `write_token` text;
--> statement-breakpoint
ALTER TABLE `algorithm_problems` ADD `row_version` integer DEFAULT 1 NOT NULL;
--> statement-breakpoint
ALTER TABLE `algorithm_problems` ADD `write_token` text;
--> statement-breakpoint
ALTER TABLE `projects` ADD `row_version` integer DEFAULT 1 NOT NULL;
