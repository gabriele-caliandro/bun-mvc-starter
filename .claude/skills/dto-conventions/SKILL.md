---
name: dto-conventions
description: Use when creating or changing a DTO, Zod schema, entity type, filter schema, or when adding/renaming a field that crosses the database/service/API boundary in a Bun + Drizzle + Elysia backend. Covers the explicit (non-derived) three-layer model and the standard schema family per entity.
---

# DTO conventions

## The core rule: three layers, explicitly defined, never derived

Every entity exists in up to three independent representations:

| Layer | Artifact | Lives in |
|---|---|---|
| Database | Drizzle table (`*.sql.ts`) | `src/database/schemas/.../tables/` |
| Service/domain | Zod DTO schemas + inferred types | `src/services/<domain>/dto/` |
| API | response/request extensions of the DTO | `src/api/v1/<resource>/schemas.ts` (only when they differ from the DTO) |

They are **related but not derived**:

- ❌ `createSelectSchema(orders)` / `createInsertSchema(orders)` (drizzle-zod)
- ❌ `type Order = typeof orders.$inferSelect` escaping the service layer
- ❌ building an API schema by importing the table definition
- ✅ each layer written out by hand; the **service's explicit `.select({...})` projection / insert `values({...})` / mapping object is the single conversion point** between table row and DTO, checked by the compiler.

Why: the DB evolves for storage reasons (typo'd legacy columns, denormalization, sequences), the API evolves for consumer reasons (renames, computed fields, hiding columns). Deriving one from another couples them so a migration silently becomes an API break. The cost — writing a field name up to three times — is the point: adding a field to the API is a *decision at each layer*, not a side effect. When a field is added to a table, nothing changes in the API until someone explicitly adds it to the DTO and/or API schema.

## The standard schema family per entity

One DTO file per entity: `src/services/orders/dto/Order.ts`.

```ts
import { PaginationMetaSchema } from "@/api/schemas/common.schema";
import { query_boolean, query_number, query_string_array } from "@/utils/schema-validator/query-params";
import { z } from "zod";

// 1. The entity as read back from the service — the one place every field is documented
export const OrderSchema = z
  .object({
    code: z.string().meta({ description: "Unique identifier for the order" }),
    description: z.string().nullable().meta({ description: "Human-readable description of the order" }),
    status: z.enum(["OPEN", "SHIPPED", "CANCELLED"]).meta({ description: "Current lifecycle status" }),
  })
  .meta({
    title: "Order",
    description: "A customer order tracked through the fulfillment lifecycle.",
  });
export type Order = z.infer<typeof OrderSchema>;

// 2. Creation input (fields the caller provides; server-generated fields absent or optional)
//    Bare fields: same meaning as on Order. Only `code` gets a description — it says something new.
export const NewOrderSchema = z
  .object({
    code: z.string().optional().meta({ description: "Order code; generated when omitted" }),
    description: z.string().optional(),
  })
  .meta({ title: "NewOrder", description: "Payload to create an order" });
export type NewOrder = z.infer<typeof NewOrderSchema>;

// 3. Update input: every field optional, at least one required
export const UpdateOrderSchema = z
  .object({
    description: z.string().nullable().optional().meta({ description: "Pass `null` to clear the description" }),
    status: z.enum(["OPEN", "SHIPPED", "CANCELLED"]).optional(),
  })
  .refine((data) => Object.values(data).some((v) => v !== undefined), {
    message: "At least one field must be provided",
  })
  .meta({ title: "UpdateOrder", description: "Fields to update for an order; omitted fields are left untouched" });
export type UpdateOrder = z.infer<typeof UpdateOrderSchema>;

// 4. List filters — built with query_* helpers so the schema works directly as an Elysia `query` schema
//    Only the fields that are NOT plain Order fields need a description.
export const OrderFiltersSchema = z
  .object({
    codes: query_string_array().optional(),
    status: z.enum(["OPEN", "SHIPPED", "CANCELLED"]).optional(),
    q: z.string().optional().meta({ description: "Fuzzy search text (matches against code)" }),
    is_urgent: query_boolean().optional().meta({ description: "Only orders flagged urgent by the warehouse" }),
    page: query_number().optional().meta({ description: "Page number (default 1)" }),
    page_size: query_number().optional().meta({ description: "Page size (default 50, max 500)" }),
  })
  .meta({ title: "OrderFilters", description: "Filter criteria for querying orders" });
export type OrderFilters = z.infer<typeof OrderFiltersSchema>;

// 5. Paginated envelope returned by the list service method
export const PaginatedOrdersSchema = z.object({
  data: z.array(OrderSchema),
  meta: PaginationMetaSchema,
});
export type PaginatedOrders = z.infer<typeof PaginatedOrdersSchema>;
```

Rules:

- Every schema gets `.meta({ title, description })` — that's what names it in Swagger. Make the schema-level description carry the contract of the whole payload ("omitted fields are left untouched"), so individual fields don't have to.
- **Per-field descriptions live on the entity schema only.** The entity schema (`OrderSchema`) documents every field. `New*`, `Update*` and `*Filters` are still written out by hand, but their fields stay **bare** when they mean the same thing as on the entity — a reader gets the semantics from `Order`. Repeating "Human-readable description of the order" four times bloats the DTO and adds nothing to the generated docs.
- Add a `.meta({ description })` on an input-schema field **only when it says something the entity schema doesn't**:
  - the field doesn't exist on the entity (`q`, `page`, `page_size`, a filter-only flag);
  - its behaviour differs here (`code` is generated when omitted, `null` clears a value, a filter matches a range rather than an exact value);
  - the filter's semantics aren't obvious from the name (`codes` filtering on `code` is obvious; `since` is not).
- Never write a description that just restates the field name (`status` → "The status of the order"). If that's all there is to say, leave the field bare — including on the entity schema.
- Every schema exports its inferred type via `z.infer` right below it. Plain TS types without a schema are fine only for internal, never-validated shapes (e.g. an `Update*` used only service-side).
- Semantics: **`nullable`** = the value can be `null` in the data; **`optional`** = the key may be absent from the payload. Update schemas typically need `.nullable().optional()` (absent = don't touch, `null` = clear).
- Reference other entities by their key type: `customer_code: z.string()` in the schema, `Order["code"]` in function signatures.

## API-only schemas

When the API response differs from the domain DTO (extra computed/presentation fields, hidden columns), extend in the resource's `schemas.ts` — don't pollute the domain DTO:

```ts
// src/api/v1/orders/schemas.ts
export const OrderApiResponseSchema = OrderSchema.extend({
  display_color: z.string().nullable().meta({ description: "Display color for the order in the UI" }),
});
export type OrderApiResponse = z.infer<typeof OrderApiResponseSchema>;
```

The extended field is new, so it carries its own description; the inherited ones keep theirs from `OrderSchema`.

If the **service** already returns that shape, the type belongs in the DTO file instead, under its own name. Either way: the shape is named once and reused — never repeat anonymous intersections like `Order & { display_color: string | null }` across method signatures.

## Variant entities (discriminated unions)

Entities with typed variants (constraint kinds, strategy kinds) define per-variant schemas in per-variant directories, discriminated by a `type` literal, and the DTO file exposes the unions:

```ts
export const ConstraintSchema = z.discriminatedUnion("type", [MaxDwellTimeConstraintSchema, MinAgingConstraintSchema]);
```

The same union treatment applies to their `New*` and input schemas. Document each variant's fields on the variant's own entity schema; the `New*` variants follow the bare-field rule above.

## Checklist when a field is added or renamed

1. Table column (`add-db-table` skill) — if it's stored
2. DTO schema(s): entity? New? Update? Filters? — each is a separate decision
3. Description written **once**, on the entity schema (input schemas only if the field is input-only or behaves differently there)
4. Service projection/mapping updated (compiler will point at the explicit `.select`/mapping)
5. API schema extension, if the field is API-only
6. `with_models` registration still accurate (new schemas registered)
