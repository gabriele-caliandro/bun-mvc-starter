# Service reference implementation

Fictional `orders` domain. Assumes DTOs from the `dto-conventions` skill and an `orders` table from the `add-db-table` skill.

## Interface

```ts
// src/services/orders/OrdersServiceI.ts
import type { AppError } from "@/errors/base/AppError";
import type { NewOrder, Order, OrderFilters, PaginatedOrders, UpdateOrder } from "@/services/orders/dto/Order";
import type { Result } from "neverthrow";

export interface OrdersServiceI {
  add_order(new_order: NewOrder): Promise<Result<Order, AppError>>;
  get_order_by_code(code: Order["code"]): Promise<Result<Order, AppError>>;
  get_orders(filters?: OrderFilters): Promise<Result<PaginatedOrders, AppError>>;
  update_order(code: Order["code"], updates: UpdateOrder): Promise<Result<Order, AppError>>;
  delete_order(code: Order["code"]): Promise<Result<void, AppError>>;
}
```

Note `Order["code"]` instead of `string` — ties the parameter to the DTO.

## Implementation

```ts
// src/services/orders/OrdersService.ts
import { orders } from "@/database/schemas/app_schema/tables/orders/orders.sql";
import type { AppError } from "@/errors/base/AppError";
import { ConflictError } from "@/errors/domain/ConflictError";
import { DatabaseError } from "@/errors/domain/DatabaseError";
import { NotFoundError } from "@/errors/domain/NotFoundError";
import type { NewOrder, Order, OrderFilters, PaginatedOrders, UpdateOrder } from "@/services/orders/dto/Order";
import type { OrdersServiceI } from "@/services/orders/OrdersServiceI";
import { get_error_details } from "@/utils/get-error-details";
import { is_pg_error, PG_ERROR_CODES } from "@/utils/pg-errors";
import { LoggerManager } from "@/utils/logger/LoggerManager";
import { and, count, eq, ilike, inArray } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { err, ok, type Result } from "neverthrow";

const logger = LoggerManager.get_logger();

const DEFAULT_PAGE_SIZE = 50;
const MAX_PAGE_SIZE = 500;

export class OrdersService implements OrdersServiceI {
  constructor(private readonly db: PostgresJsDatabase<Record<string, never>>) {}

  async add_order(new_order: NewOrder): Promise<Result<Order, AppError>> {
    try {
      const inserted = await this.db
        .insert(orders)
        .values({
          code: new_order.code,
          description: new_order.description,
          status: "OPEN",
        })
        .returning();

      if (inserted.length === 0) {
        logger.error({ code: new_order.code }, "No rows inserted for order");
        return err(new DatabaseError(`No rows inserted for order with code '${new_order.code}'`));
      }

      // Explicit mapping row → DTO. No `as` casts, no leaking the row type.
      return ok({
        code: inserted[0].code,
        description: inserted[0].description,
        status: inserted[0].status,
      });
    } catch (error) {
      if (is_pg_error(error, PG_ERROR_CODES.UNIQUE_VIOLATION)) {
        return err(new ConflictError(`Order with code '${new_order.code}' already exists`));
      }
      logger.error({ error: get_error_details(error), code: new_order.code }, "Failed to add order");
      return err(new DatabaseError("Failed to add order to database", error));
    }
  }

  async get_order_by_code(code: Order["code"]): Promise<Result<Order, AppError>> {
    try {
      const rows = await this.db
        .select({
          code: orders.code,
          description: orders.description,
          status: orders.status,
        })
        .from(orders)
        .where(eq(orders.code, code));

      if (rows.length === 0) {
        return err(new NotFoundError("Order", code)); // miss → NotFoundError, never InternalError
      }

      return ok(rows[0]);
    } catch (error) {
      logger.error({ error: get_error_details(error), code }, "Failed to retrieve order");
      return err(new DatabaseError("Failed to retrieve order from database", error));
    }
  }

  async get_orders(filters?: OrderFilters): Promise<Result<PaginatedOrders, AppError>> {
    try {
      const page = filters?.page ?? 1;
      const page_size = Math.min(filters?.page_size ?? DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE);

      const where_clause = and(
        filters?.codes ? inArray(orders.code, filters.codes) : undefined,
        // explicit !== undefined: a truthiness check would drop legitimate `false`/`0` filters
        filters?.status !== undefined ? eq(orders.status, filters.status) : undefined,
        filters?.q ? ilike(orders.code, `%${filters.q}%`) : undefined
      );

      const [{ total_items }] = await this.db.select({ total_items: count() }).from(orders).where(where_clause);

      const rows = await this.db
        .select({
          code: orders.code,
          description: orders.description,
          status: orders.status,
        })
        .from(orders)
        .where(where_clause)
        .orderBy(orders.code)
        .limit(page_size)
        .offset((page - 1) * page_size);

      const total_pages = Math.ceil(total_items / page_size);
      return ok({
        data: rows,
        meta: {
          page,
          page_size,
          total_items,
          total_pages,
          has_next_page: page < total_pages,
          has_previous_page: page > 1,
        },
      });
    } catch (error) {
      logger.error({ error: get_error_details(error) }, "Failed to retrieve orders");
      return err(new DatabaseError("Failed to retrieve orders from database", error));
    }
  }

  async update_order(code: Order["code"], updates: UpdateOrder): Promise<Result<Order, AppError>> {
    try {
      const updated = await this.db
        .update(orders)
        .set({
          ...(updates.description !== undefined ? { description: updates.description } : {}),
          ...(updates.status !== undefined ? { status: updates.status } : {}),
          updated_at: new Date(),
        })
        .where(eq(orders.code, code))
        .returning();

      if (updated.length === 0) {
        return err(new NotFoundError("Order", code));
      }

      return ok({
        code: updated[0].code,
        description: updated[0].description,
        status: updated[0].status,
      });
    } catch (error) {
      logger.error({ error: get_error_details(error), code }, "Failed to update order");
      return err(new DatabaseError("Failed to update order in database", error));
    }
  }

  async delete_order(code: Order["code"]): Promise<Result<void, AppError>> {
    try {
      const deleted = await this.db.delete(orders).where(eq(orders.code, code)).returning({ code: orders.code });

      if (deleted.length === 0) {
        return err(new NotFoundError("Order", code));
      }

      return ok(undefined);
    } catch (error) {
      logger.error({ error: get_error_details(error), code }, "Failed to delete order");
      return err(new DatabaseError("Failed to delete order from database", error));
    }
  }
}
```

## Composable query file

```ts
// src/services/orders/queries/query_get_open_order_codes.ts
import { orders } from "@/database/schemas/app_schema/tables/orders/orders.sql";
import { eq } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";

/**
 * Query for the codes of all open orders.
 * Pure query builder: not executed here, no error handling, no mapping —
 * callers execute it or wrap it as a CTE via db.$with("open_orders").as(query_get_open_order_codes(db)).
 */
export const query_get_open_order_codes = (db: PostgresJsDatabase<Record<string, never>>) =>
  db.select({ code: orders.code }).from(orders).where(eq(orders.status, "OPEN"));
```

## Postgres error codes util (create once per repo if missing)

Named struct instead of magic numbers scattered through services; extend it as new codes are needed.

```ts
// src/utils/pg-errors.ts

/** PostgreSQL error codes (https://www.postgresql.org/docs/current/errcodes-appendix.html) */
export const PG_ERROR_CODES = {
  UNIQUE_VIOLATION: "23505",
  FOREIGN_KEY_VIOLATION: "23503",
  NOT_NULL_VIOLATION: "23502",
  CHECK_VIOLATION: "23514",
} as const;
export type PgErrorCode = (typeof PG_ERROR_CODES)[keyof typeof PG_ERROR_CODES];

/** True when `error` is a postgres driver error carrying the given code. */
export const is_pg_error = (error: unknown, code: PgErrorCode): boolean =>
  typeof error === "object" && error !== null && (error as { code?: string }).code === code;
```

## Error details util (message + stack, create once per repo if missing)

Logs must carry the stack trace, not just the message.

```ts
// src/utils/get-error-details.ts

/**
 * Extracts message and stack from an unknown error for structured logging.
 * Prefer this over message-only helpers: without the stack, production logs
 * tell you what failed but not where.
 */
export const get_error_details = (error: unknown): { message: string; stack?: string } => {
  if (error instanceof Error) {
    return { message: error.message, stack: error.stack };
  }
  try {
    return { message: JSON.stringify(error, null, 2) };
  } catch {
    return { message: String(error) };
  }
};
```
