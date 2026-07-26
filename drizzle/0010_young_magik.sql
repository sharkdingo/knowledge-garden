CREATE TABLE `article_drafts` (
	`article_slug` text PRIMARY KEY NOT NULL,
	`payload` text NOT NULL,
	`saved_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `article_revisions` (
	`id` text PRIMARY KEY NOT NULL,
	`article_slug` text NOT NULL,
	`payload` text NOT NULL,
	`reason` text NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`article_slug`) REFERENCES `articles`(`slug`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `article_revisions_article_created_idx` ON `article_revisions` (`article_slug`,`created_at`);