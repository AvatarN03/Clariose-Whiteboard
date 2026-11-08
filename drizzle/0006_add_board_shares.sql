CREATE TABLE "board_shares" (
	"id" serial PRIMARY KEY NOT NULL,
	"project_id" varchar NOT NULL,
	"email" varchar NOT NULL,
	"token" varchar NOT NULL,
	"permission" varchar DEFAULT 'viewer' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
ALTER TABLE "board_shares" ADD CONSTRAINT "board_shares_project_id_boards_projectId_fk" FOREIGN KEY ("project_id") REFERENCES "public"."boards"("projectId") ON DELETE no action ON UPDATE no action;
ALTER TABLE "board_shares" ADD CONSTRAINT "board_shares_token_unique" UNIQUE("token");
ALTER TABLE "board_shares" ADD CONSTRAINT "board_shares_project_email_unique" UNIQUE("project_id","email");
CREATE INDEX "board_shares_project_idx" ON "board_shares" USING btree ("project_id");
