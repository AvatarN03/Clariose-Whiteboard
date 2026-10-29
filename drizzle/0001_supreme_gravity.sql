CREATE TABLE "boards" (
	"id" serial PRIMARY KEY NOT NULL,
	"projectId" varchar NOT NULL,
	"projectName" varchar NOT NULL,
	"userEmail" varchar NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "boards_projectId_unique" UNIQUE("projectId")
);
