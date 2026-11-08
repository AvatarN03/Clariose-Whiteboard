CREATE TABLE "documents" (
	"id" serial PRIMARY KEY NOT NULL,
	"project_id" varchar NOT NULL,
	"title" text NOT NULL,
	"content" jsonb DEFAULT '{"type":"doc","content":[]}'::jsonb NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
ALTER TABLE "documents" ADD CONSTRAINT "documents_project_id_boards_projectId_fk" FOREIGN KEY ("project_id") REFERENCES "public"."boards"("projectId") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "documents_project_position_idx" ON "documents" USING btree ("project_id","position");
