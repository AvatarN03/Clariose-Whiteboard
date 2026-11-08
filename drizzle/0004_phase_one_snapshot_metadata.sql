ALTER TABLE "whiteboardData"
ADD COLUMN "snapshot_version" integer DEFAULT 1 NOT NULL;
--> statement-breakpoint
ALTER TABLE "whiteboardData"
ADD COLUMN "updated_at" timestamp DEFAULT now() NOT NULL;