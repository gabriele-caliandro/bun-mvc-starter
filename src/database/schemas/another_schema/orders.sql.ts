import { another_schema } from "@/database/schemas/another_schema/another_schema.sql";
import { text } from "drizzle-orm/pg-core";

export const orders = another_schema.table("orders", {
  id: text().primaryKey(),
});
