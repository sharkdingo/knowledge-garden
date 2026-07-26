CREATE TABLE `article_sections` (
	`article_slug` text NOT NULL,
	`section_id` text NOT NULL,
	`title` text NOT NULL,
	`paragraphs` text NOT NULL,
	`sort_order` integer NOT NULL,
	PRIMARY KEY(`article_slug`, `section_id`),
	FOREIGN KEY (`article_slug`) REFERENCES `articles`(`slug`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `article_tags` (
	`article_slug` text NOT NULL,
	`tag_id` text NOT NULL,
	PRIMARY KEY(`article_slug`, `tag_id`),
	FOREIGN KEY (`article_slug`) REFERENCES `articles`(`slug`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`tag_id`) REFERENCES `tags`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `articles` (
	`slug` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`summary` text NOT NULL,
	`published_at` text NOT NULL,
	`display_date` text NOT NULL,
	`category_id` text NOT NULL,
	`minutes` integer NOT NULL,
	`featured` integer DEFAULT false NOT NULL,
	`lead` text NOT NULL,
	`quote` text,
	`callout_label` text,
	`callout_lines` text,
	`status` text DEFAULT 'published' NOT NULL,
	FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `categories` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text NOT NULL,
	`sort_order` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `categories_name_unique` ON `categories` (`name`);--> statement-breakpoint
CREATE TABLE `navigation_items` (
	`id` text PRIMARY KEY NOT NULL,
	`location` text NOT NULL,
	`href` text NOT NULL,
	`label` text NOT NULL,
	`sort_order` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `projects` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`subtitle` text NOT NULL,
	`description` text NOT NULL,
	`status` text NOT NULL,
	`status_label` text NOT NULL,
	`category` text NOT NULL,
	`stack` text NOT NULL,
	`updated_at` text NOT NULL,
	`visual` text NOT NULL,
	`related_article_slug` text,
	`repository_url` text,
	`demo_url` text,
	`sort_order` integer NOT NULL,
	FOREIGN KEY (`related_article_slug`) REFERENCES `articles`(`slug`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `projects_name_unique` ON `projects` (`name`);--> statement-breakpoint
CREATE TABLE `site_settings` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `tags` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `tags_name_unique` ON `tags` (`name`);