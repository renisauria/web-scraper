CREATE TABLE `products` (
	`id` text PRIMARY KEY NOT NULL,
	`project_id` text NOT NULL REFERENCES `projects`(`id`) ON DELETE cascade,
	`page_id` text NOT NULL REFERENCES `pages`(`id`) ON DELETE cascade,
	`name` text NOT NULL,
	`description` text,
	`price` text,
	`currency` text DEFAULT 'USD',
	`variants` text,
	`specifications` text,
	`images` text,
	`category` text,
	`brand` text,
	`sku` text,
	`availability` text,
	`raw_extraction` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
