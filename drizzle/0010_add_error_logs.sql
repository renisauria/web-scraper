CREATE TABLE `error_logs` (
	`id` text PRIMARY KEY NOT NULL,
	`route` text NOT NULL,
	`method` text NOT NULL,
	`message` text NOT NULL,
	`stack` text,
	`context` text,
	`created_at` integer NOT NULL
);
