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

// 1. The entity as read back from the service
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
export const NewOrderSchema = z
  .object({
    code: z.string().optional().meta({ description: "Order code; generated when omitted" }),
    description: z.string().optional().meta({ description: "Human-readable description of the order" }),
  })
  .meta({ title: "NewOrder", description: "Payload to create an order" });
export type NewOrder = z.infer<typeof NewOrderSchema>;

// 3. Update input: every field optional, at least one required
export const UpdateOrderSchema = z
  .object({
    description: z.string().nullable().optional().meta({ description: "Human-readable description of the order" }),
    status: z.enum(["OPEN", "SHIPPED", "CANCELLED"]).optional().meta({ description: "Current lifecycle status" }),
  })
  .refine((data) => Object.values(data).some((v) => v !== undefined), {
    message: "At least one field must be provided",
  })
  .meta({ title: "UpdateOrder", description: "Fields to update for an order" });
export type UpdateOrder = z.infer<typeof UpdateOrderSchema>;

// 4. List filters — built with query_* helpers so the schema works directly as an Elysia `query` schema
export const OrderFiltersSchema = z
  .object({
    codes: query_string_array().optional().meta({ description: "Filter by order codes" }),
    q: z.string().optional().meta({ description: "Fuzzy search text (matches against code)" }),
    status: z.enum(["OPEN", "SHIPPED", "CANCELLED"]).optional().meta({ description: "Filter by status" }),
    is_urgent: query_boolean().optional().meta({ description: "Filter by urgency flag" }),
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

- Every schema: `.meta({ title, description })`. Every field: `.meta({ description })`. These feed Swagger directly.
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

If the **service** already returns that shape, the type belongs in the DTO file instead, under its own name. Either way: the shape is named once and reused — never repeat anonymous intersections like `Order & { display_color: string | null }` across method signatures.

## Variant entities (discriminated unions)

Entities with typed variants (constraint kinds, strategy kinds) define per-variant schemas in per-variant directories, discriminated by a `type` literal, and the DTO file exposes the unions:

```ts
export const ConstraintSchema = z.discriminatedUnion("type", [MaxDwellTimeConstraintSchema, MinAgingConstraintSchema]);
```

The same union treatment applies to their `New*` and input schemas. See the `add-service` skill (factory + strategy) for the implementation side.

## Checklist when a field is added or renamed

1. Table column (`add-db-table` skill) — if it's stored
2. DTO schema(s): entity? New? Update? Filters? — each is a separate decision
3. Service projection/mapping updated (compiler will point at the explicit `.select`/mapping)
4. API schema extension, if the field is API-only
5. `with_models` registration still accurate (new schemas registered)
