import { my_schema_name } from "@/database/my_schema_name";
import { integer, text } from "drizzle-orm/pg-core";
import { createSelectSchema, createInsertSchema } from "drizzle-typebox";

export const users = my_schema_name.table("users", {
  id: text().primaryKey(),
  name: text().notNull(),
  surname: text().notNull(),
  age: integer(),
});
export const usersSelectSchema = createSelectSchema(users);
export const usersInsertSchema = createInsertSchema(users);
