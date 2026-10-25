import { relations } from "drizzle-orm";
import { posts, users } from "./schema";

export const postsRelations = relations(posts, ({ one }) => ({
  user: one(users, {
    fields: [posts.authorId],
    references: [users.id],
  }),
}));

export const usersRelations = relations(users, ({ many }) => ({
  posts: many(posts),
}));
