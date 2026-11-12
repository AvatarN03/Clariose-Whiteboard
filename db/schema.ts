import {
  foreignKey,
  index,
  integer,
  jsonb,
  pgTable,
  serial,
  text,
  timestamp,
  unique,
  varchar,
} from "drizzle-orm/pg-core";

export const users = pgTable(
  "users",
  {
    id: serial().primaryKey().notNull(),
    name: text(),
    email: text().notNull(),
    credits: integer().default(0).notNull(),
    createdAt: timestamp("created_at", { mode: "string" })
      .defaultNow()
      .notNull(),
  },
  (table) => [unique("users_email_unique").on(table.email)],
);

export const posts = pgTable(
  "posts",
  {
    id: serial().primaryKey().notNull(),
    title: text().notNull(),
    content: text(),
    authorId: serial("author_id").notNull(),
    createdAt: timestamp("created_at", { mode: "string" })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    foreignKey({
      columns: [table.authorId],
      foreignColumns: [users.id],
      name: "posts_author_id_users_id_fk",
    }),
  ],
);

export const boards = pgTable("boards", {
  id: serial().primaryKey().notNull(),
  projectId: varchar("projectId").notNull().unique(),
  projectName: varchar("projectName").notNull(),
  userEmail: varchar("userEmail").notNull(),
  createdAt: timestamp("created_at", { mode: "string" })
    .defaultNow()
    .notNull(),
  archivedAt: timestamp("archived_at", { mode: "string" }),
});

export const boardShares = pgTable(
  "board_shares",
  {
    id: serial("id").primaryKey(),
    projectId: varchar("project_id")
      .notNull()
      .references(() => boards.projectId),
    email: varchar("email").notNull(),
    recipientUserId: varchar("recipient_user_id"),
    token: varchar("token").notNull(),
    permission: varchar("permission").notNull().default("viewer"),
    createdAt: timestamp("created_at", { mode: "string" })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    unique("board_shares_token_unique").on(table.token),
    unique("board_shares_project_email_unique").on(
      table.projectId,
      table.email,
    ),
    index("board_shares_project_idx").on(table.projectId),
    index("board_shares_recipient_user_idx").on(table.recipientUserId),
  ],
);

export const whiteboardData = pgTable("whiteboardData", {
  id: serial("id").primaryKey(),
  projectId: varchar("projectId")
    .notNull()
    .references(() => boards.projectId),
  snapshotVersion: integer("snapshot_version").default(1).notNull(),
  updatedAt: timestamp("updated_at", { mode: "string" })
    .defaultNow()
    .notNull(),
  elements: jsonb("elements"),
  appState: jsonb("appState"),
  files: jsonb("files"),
});

export const documents = pgTable(
  "documents",
  {
    id: serial("id").primaryKey(),
    projectId: varchar("project_id")
      .notNull()
      .references(() => boards.projectId),
    title: text("title").notNull(),
    content: jsonb("content").notNull().default({ type: "doc", content: [] }),
    position: integer("position").notNull().default(0),
    createdAt: timestamp("created_at", { mode: "string" })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { mode: "string" })
      .defaultNow()
      .notNull(),
  },
  (table) => [index("documents_project_position_idx").on(table.projectId, table.position)],
);
