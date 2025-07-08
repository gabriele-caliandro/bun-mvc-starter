import { defineConfig } from "drizzle-kit";

export default defineConfig({
  out: "./drizzle",
  schema: "./src/database/schemas/**/*.sql.ts",
  dialect: "postgresql",
  schemaFilter: ["my_schema", "another_schema"],
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
  verbose: true,
  strict: true,
});
