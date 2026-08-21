---
name: add-api-resource
description: Use when adding or modifying an HTTP API resource in an Elysia + Bun backend — a new endpoint, route handler, route file, or exposing an entity over the API. Covers file layout, handler shape, full-CRUD-by-default, filters, pagination, auth, and OpenAPI registration.
---

# Add an API resource

How API endpoints are built in this codebase family (Bun + Elysia + Zod + neverthrow + ServiceRegistry). Complete annotated examples live in [reference/endpoint-examples.md](reference/endpoint-examples.md) — read them before writing a handler.

## Before writing anything, locate the repo landmarks

These repos share the pattern but not the file names. Find (grep) the local equivalents of:

- **`base_endpoint` / `protected_endpoint`** helpers (usually `src/api/helpers/`) — every endpoint plugin builds on one of these, never on a raw `new Elysia()` chain.
- **`with_models` plugin** (usually `src/api/plugins/`) — global OpenAPI model registry.
- **The central route registrar** — the file where `*_routes(service_registry)` plugins are `.use()`d together (search for `_routes(service_registry)`). New resources must be registered there.
- **`ServiceRegistry`** type (usually `src/controllers/`) — the DI container passed into every endpoint plugin.
- **Query param helpers** `query_string_array` / `query_boolean` / `query_number` / `query_number_array` (usually `src/utils/schema-validator/query-params.ts`).
- **`ErrorSchema` and `PaginationMetaSchema`** in the shared API schemas file (usually `src/api/schemas/common.schema.ts`).

If a landmark is missing (brand-new codebase), create it following the shapes in the reference file.

## File layout

One file per HTTP verb, `[param]` directories for path params, one `route.ts` aggregator per resource:

```
src/api/v1/orders/
  get.ts               # GET /v1/orders (list + filters + pagination)
  post.ts              # POST /v1/orders
  route.ts             # aggregates all order endpoints into one plugin
  schemas.ts           # API-only schemas (response extensions), if needed
  [code]/
    get.ts             # GET /v1/orders/:code
    patch.ts           # PATCH /v1/orders/:code
    delete.ts          # DELETE /v1/orders/:code
    cancel/
      post.ts          # POST /v1/orders/:code/cancel (action endpoint)
```

Non-CRUD operations are **action endpoints**: a verb-named sub-path with `post.ts` (e.g. `/orders/:code/cancel`, `/lanes/:id/remove-head`). Never encode actions in the body of a PATCH.

## A new resource ships complete

When asked to "add an endpoint for X", deliver the **full CRUD set by default** unless explicitly told otherwise:

1. GET list — with a `{Entity}FiltersSchema` and pagination
2. GET by identifier
3. POST create
4. PATCH update
5. DELETE

Plus: DTOs, service methods, `route.ts`, registration in the central registrar, OpenAPI models. Adding a resource is a vertical slice (see the `add-service`, `add-db-table`, and `dto-conventions` skills for the other layers).

## Handler rules

- Each endpoint file exports a **plugin factory**: `export const get_orders = (service_registry: ServiceRegistry) => base_endpoint(service_registry).get(...)`.
- Always start from `base_endpoint(service_registry)` or `protected_endpoint(service_registry, { permissions: [...] })`. Never hand-roll `new Elysia().use(with_service_registry(...)).use(with_models())`.
- Handlers are **thin**: validate/normalize input → call one service method (occasionally compose two) → handle the Result → return. Business logic lives in services, never in handlers.
- Handle Results by throwing:

  ```ts
  const res = await service_registry.orders_service.get_orders(query);
  if (res.isErr()) {
    throw res.error; // error middleware maps AppError.httpStatusCode → response
  }
  return res.value;
  ```

  - ❌ `return { error: res.error.message }`
  - ❌ `throw new Error("not found")` — handlers may only throw `AppError` subclasses (`NotFoundError`, `ConflictError`, …) so the middleware picks the right status code.
- Success responses are returned directly: `return res.value`. Never `return status(200, ...)` / `status(201, ...)`.
- **No query re-parsing in handlers.** The `query_*` helpers inside the FiltersSchema already normalize strings/arrays/booleans/numbers. Do not add `transform` hooks or manual `Array.isArray(...)` re-normalization — if the schema is right, `query` can be passed to the service as-is.

## Filters

- Each listable entity has a `{Entity}FiltersSchema` defined **once**, in the entity's DTO file (see `dto-conventions` skill), built from the `query_*` helpers so it works directly as an Elysia `query` schema.
- Standard filter set for every list endpoint (include by default):
  - `codes` / `ids` — `query_string_array()` / `query_number_array()`, exact-match set
  - `q` — `z.string()`, fuzzy text search on the natural key
  - domain flags (e.g. `is_obsolete`) — `query_boolean()`
  - `page`, `page_size` — `query_number()` (pagination, below)
  - all `.optional()`, each with `.meta({ description })`
- The list service method signature is `get_orders(filters?: OrderFilters)`; absent filters mean "no restriction" (see `add-service` skill for the `where(and(...))` build).

## Pagination — default for every new list endpoint

New GET-list endpoints return a paginated envelope, not a bare array:

```ts
{ data: Order[], meta: PaginationMeta }
```

`PaginationMeta` = `{ page, page_size, total_items, total_pages, has_next_page, has_previous_page }` from the shared schemas file. Default `page = 1`, `page_size = 50` (cap at 500). Only skip pagination when the resource is a small bounded set (type registries, enums) — and say so in the endpoint description.

## Auth and permissions

- Anything **mutating** (POST/PATCH/DELETE and state-changing actions) uses `protected_endpoint(service_registry, { permissions: [...] })`. Deciding *which* permission is a mandatory step of adding the endpoint — ask the user if it isn't obvious.
- Read endpoints may use `base_endpoint` unless the resource is sensitive.

## Response schemas and status codes

- `response` map per endpoint, all Zod (or a registered model name string): success schema on `200`, `ErrorSchema` on the rest.
- Keep the error map minimal: `500` always; `404` only when the handler/service explicitly checks existence; `409` only for uniqueness conflicts on create. No 400/401/403 unless the endpoint genuinely produces them (auth ones come from `protected_endpoint`).

## OpenAPI

- Every schema gets `.meta({ title, description })`; every field gets `.meta({ description })`.
- Register entity schemas (and their `[]` array variants) in the `with_models` plugin so routes can reference them by name and they show in Swagger.
- Every endpoint has `detail: { summary, description, tags: [SWAGGER_TAGS.X] }`. Add a new tag constant for a new resource.

## Checklist for a new resource

1. DTOs (`dto-conventions` skill) — entity, New, Update, Filters schemas
2. Table (`add-db-table` skill) if new storage is needed
3. Service interface + implementation (`add-service` skill)
4. Service added to `ServiceRegistry` type and instantiated in the composition root (`main.ts`)
5. Endpoint files per verb + `route.ts` aggregator
6. `route.ts` registered in the central route registrar
7. Models registered in `with_models`, tag added to `SWAGGER_TAGS`
8. `bun run tsc` and `bun run lint` pass
