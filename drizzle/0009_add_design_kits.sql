CREATE TABLE `design_kits` (
	`id` text PRIMARY KEY NOT NULL,
	`project_id` text NOT NULL,
	`file_name` text NOT NULL,
	`tokens` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE cascade
);
