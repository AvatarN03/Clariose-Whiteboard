import {
  foreignKey,
  integer,
  pgTable,
  serial,
  text,
  timestamp,
  unique,
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
