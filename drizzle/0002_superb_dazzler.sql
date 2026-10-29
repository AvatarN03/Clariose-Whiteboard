CREATE TABLE "whiteboardData" (
	"id" serial PRIMARY KEY NOT NULL,
	"projectId" varchar NOT NULL,
	"elements" jsonb,
	"appState" jsonb,
	"files" jsonb
);
--> statement-breakpoint
ALTER TABLE "whiteboardData" ADD CONSTRAINT "whiteboardData_projectId_boards_projectId_fk" FOREIGN KEY ("projectId") REFERENCES "public"."boards"("projectId") ON DELETE no action ON UPDATE no action;