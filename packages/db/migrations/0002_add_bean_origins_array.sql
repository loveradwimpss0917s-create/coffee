ALTER TABLE `beans` ADD `origins` text DEFAULT '[]' NOT NULL;--> statement-breakpoint
UPDATE `beans` SET `origins` = json_array(`origin`) WHERE `origin` IS NOT NULL AND trim(`origin`) != '';--> statement-breakpoint
ALTER TABLE `beans` DROP COLUMN `origin`;
