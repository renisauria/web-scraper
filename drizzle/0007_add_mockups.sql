CREATE TABLE `mockups` (
	`id` text PRIMARY KEY NOT NULL,
	`project_id` text NOT NULL,
	`prompt` text NOT NULL,
	`image` text NOT NULL,
	`label` text,
	`style` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE cascade
);
