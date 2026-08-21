---
name: add-service
description: Use when creating or extending a service (business logic layer) in a Bun + Drizzle + neverthrow backend — a new domain service, service method, repository, complex query, or pluggable strategy/validator. Covers the interface+implementation pair, Result-based error handling, typed domain errors, query composition, and DI wiring.
---

# Add a service

Services hold all business logic. Handlers call services; services call the database (Drizzle) and other services. A full reference implementation lives in [reference/service-example.md](reference/service-example.md).

## Shape

Every service is an **interface + implementation pair**:

```
src/services/orders/
  OrdersServiceI.ts     # interface — what other code depends on
  OrdersService.ts      # implementation
  dto/Order.ts          # DTOs (see dto-conventions skill)
  queries/              # composable complex queries (optional)
```

- The interface is the dependency surface: other services and the ServiceRegistry reference `OrdersServiceI`, never the concrete class.
- Constructor takes `db: PostgresJsDatabase<Record<string, never>>` first. Other services are injected **by interface**. With more than ~3 dependencies, group them in a single `deps` object parameter:

```ts
export class OrdersService implements OrdersServiceI {
  constructor(
    private readonly db: PostgresJsDatabase<Record<string, never>>,
    private readonly deps: {
      materials_service: MaterialsServiceI;
      locations_service: LocationsServiceI;
    }
  ) {}
}
```

## Error handling — neverthrow + AppError

- **Every method returns `Promise<Result<T, AppError>>`.** Services never throw to callers. (`ResultAsync` is allowed only where a real chain of `.andThen()`s pays for it; the default is `Promise<Result>`.)
- `try/catch` exists **only at the database boundary**, and the catch maps to a typed domain error. The error hierarchy:
  - `AppError` (abstract, in `src/errors/base/`) — carries `type` and `httpStatusCode`; the HTTP error middleware maps it to the response, which is why services choose the status code by choosing the error class.
  - Domain errors in `src/errors/domain/`: `NotFoundError` (404), `ConflictError` (409), `DatabaseError` (500), `InternalError` (500), `ValidationError`, …
- Canonical mappings:
  - Row not found → `err(new NotFoundError("Order", code))` — **never** `InternalError` for a miss.
  - Unique violation on insert → `err(new ConflictError(...))`. Detect via the postgres error code through a **named constants struct** — never a magic number inline and never message sniffing:
    ```ts
    // ✅  is_pg_error(error, PG_ERROR_CODES.UNIQUE_VIOLATION)
    // ❌  (error as { code?: string }).code === "23505"   // magic number
    // ❌  error_message.includes("duplicate key value")   // message sniffing
    ```
    If the repo has a `pg-errors` util, use it; if not, create one in `src/utils/` (see the reference file for the struct + helper).
  - Anything else caught at the boundary → `err(new DatabaseError("Failed to <do X>", error))`, after logging with the scoped logger.
- Compose with `.map() / .mapErr() / .andThen()`; propagate with early `if (x.isErr()) return err(x.error)`.

## Return types

- Service methods return **named DTO types**, never Drizzle row types and never anonymous intersections.
  - ❌ `Promise<Result<Order & { display_color: string | null }, AppError>>` repeated on every method
  - ✅ define `OrderWithColor` (or an `OrderApiResponse`) once in the DTO file and use it everywhere
- No `as` casts to force a row into a DTO — write an explicit `.select({ ... })` projection or an explicit mapping object so the compiler checks the shape.

## Filters and pagination in list methods

- List methods take `filters?: OrderFilters` and build the where clause with `and(...)`, passing `undefined` for absent filters:

```ts
.where(
  and(
    filters?.codes ? inArray(orders.code, filters.codes) : undefined,
    filters?.status !== undefined ? eq(orders.status, filters.status) : undefined,
    filters?.q ? ilike(orders.code, `%${filters.q}%`) : undefined
  )
)
```

- Boolean/number filters must be compared against `undefined` explicitly (`filters?.flag !== undefined ? ... : undefined`) — a plain truthiness check silently drops `false`/`0`.
- Paginated list methods run a count query + a page query and return `{ data, meta }` (see reference file).

## Complex queries

- Multi-join / CTE / aggregate queries do **not** live inline in service methods. Each goes in `queries/query_<name>.ts` as a function `(db) => query` that returns an unexecuted Drizzle query.
- Query functions compose: a query can wrap another via `db.$with("name").as(other_query(db))` (CTE). Keep them pure query builders — no error handling, no mapping; the service executes them and owns the Result.
- **Alias every column in multi-table/CTE selects.** Drizzle's query builder can emit the *same* result column name for two different fields coming from different tables or CTEs (e.g. two `code` columns), silently clobbering one. Give every selected field an explicit prefixed alias via an `aliased_column` helper, and pin the projection shape with `satisfies`:

  ```ts
  // src/utils/drizzle/aliased_column.ts
  import { type AnyColumn, type GetColumnData, type SQL } from "drizzle-orm";

  export const aliased_column = <T extends AnyColumn>(column: T, alias: string): SQL.Aliased<GetColumnData<T>> =>
    column.getSQL().mapWith(column.mapFromDriverValue).as(alias);
  ```

  ```ts
  .select({
    order_code: aliased_column(orders.code, "order_code"),
    customer_code: aliased_column(customers.code, "customer_code"),
    line_quantity: lines_cte.quantity, // CTE columns are already named at the CTE boundary
  } satisfies Record<keyof FlatOrderRow, unknown>)
  ```

## Pluggable variants — factory + strategy

When a domain has open-ended variants (constraint types, allocation strategies, anomaly kinds):

- Each variant gets its own directory with its Zod schema (discriminated by a `type` literal) and its implementation class behind a shared interface.
- The domain DTO exposes `z.discriminatedUnion("type", [...])` unions for the entity, its `New*` and its inputs.
- A `<Domain>Factory` with a static `create(variant, ctx): Result<InterfaceI, AppError>` switch instantiates the right class; the `default` branch returns `err(new InternalError(...))` so unknown types fail loudly.
- Adding a variant = new directory + schema added to the unions + case added to the factory. Nothing else changes.

## Logging

- Scoped logger per file: `const logger = LoggerManager.get_logger()` (or `createLogger({ service: "orders" })` where the repo uses scoped creation).
- Log at the error boundary with structured metadata: `logger.error({ error: get_error_details(error), code }, "Failed to add order")`. Don't log-and-rethrow up the stack — one log per failure, at the boundary that caught it.
- **Log the stack, not just the message.** Error logs must include the stack trace when one exists. If the repo's error helper only extracts `.message` (a common legacy `get_error_message`), add/use a `get_error_details(error)` that returns message + stack (see the reference file) and use it in `logger.error` calls.

## Wiring checklist

1. `OrdersServiceI.ts` + `OrdersService.ts`
2. Add `orders_service: OrdersServiceI` to the `ServiceRegistry` type
3. Instantiate in the composition root (`src/main.ts`), injecting `db` and dependency services, and add it to the registry object
4. `bun run tsc` passes
