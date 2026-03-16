import { my_schema } from "@/database/schemas/my_schema/my_schema.sql";
import { integer, text } from "drizzle-orm/pg-core";

export const users = my_schema.table("users", {
  id: text().primaryKey(),
  name: text().notNull(),
  surname: text().notNull(),
  age: integer(),
});
