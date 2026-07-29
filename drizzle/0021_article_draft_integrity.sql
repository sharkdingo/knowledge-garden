PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_article_drafts` (
	`article_slug` text PRIMARY KEY NOT NULL,
	`payload` text NOT NULL,
	`saved_at` text NOT NULL,
	FOREIGN KEY (`article_slug`) REFERENCES `articles`(`slug`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_article_drafts`("article_slug", "payload", "saved_at")
SELECT d."article_slug", d."payload", d."saved_at"
FROM `article_drafts` d
INNER JOIN `articles` a ON a."slug" = d."article_slug";--> statement-breakpoint
DROP TABLE `article_drafts`;--> statement-breakpoint
ALTER TABLE `__new_article_drafts` RENAME TO `article_drafts`;--> statement-breakpoint
PRAGMA foreign_keys=ON;
