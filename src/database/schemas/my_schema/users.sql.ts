import { my_schema } from "@/database/schemas/my_schema/my_schema.sql";
import { integer, text } from "drizzle-orm/pg-core";
import { createSelectSchema, createInsertSchema } from "drizzle-typebox";

export const users = my_schema.table("users", {
  id: text().primaryKey(),
  name: text().notNull(),
  surname: text().notNull(),
  age: integer(),
});
export const usersSelectSchema = createSelectSchema(users);
export const usersInsertSchema = createInsertSchema(users);
