# Endpoint reference implementations

Complete examples for a fictional `orders` resource. Adapt names; keep the shapes. Assumes the DTO file (`@/services/orders/dto/Order`) defines `OrderSchema`, `NewOrderSchema`, `OrderFiltersSchema` (see the `dto-conventions` skill).

## GET list — paginated, filtered

```ts
// src/api/v1/orders/get.ts
import { base_endpoint } from "@/api/helpers/base-endpoint";
import { ErrorSchema, PaginationMetaSchema } from "@/api/schemas/common.schema";
import type { ServiceRegistry } from "@/controllers/ServiceRegistry";
import { SWAGGER_TAGS } from "@/network/http/tags";
import { OrderFiltersSchema, OrderSchema } from "@/services/orders/dto/Order";
import z from "zod";

export const get_orders = (service_registry: ServiceRegistry) =>
  base_endpoint(service_registry).get(
    "/v1/orders",
    async ({ query, service_registry }) => {
      // FiltersSchema already normalized every query param — pass it straight through.
      const res = await service_registry.orders_service.get_orders(query);

      if (res.isErr()) {
        throw res.error;
      }

      return res.value; // { data: Order[], meta: PaginationMeta }
    },
    {
      query: OrderFiltersSchema,
      response: {
        200: z.object({ data: z.array(OrderSchema), meta: PaginationMetaSchema }),
        500: ErrorSchema,
      },
      detail: {
        summary: "Get orders",
        description: "Returns orders, filterable by codes, status and free text. Paginated.",
        tags: [SWAGGER_TAGS.ORDERS],
      },
    }
  );
```

Anti-patterns this replaces:

```ts
// ❌ manual re-normalization — query_string_array() already did this
const filters = { codes: Array.isArray(query.codes) ? query.codes : [query.codes] };

// ❌ transform hook to coerce numbers — use query_number() in the schema instead
transform: ({ query }) => { query.limit = Number(query.limit); }

// ❌ hand-rolled plugin chain — use base_endpoint()
new Elysia().use(with_service_registry(service_registry)).use(with_models())
```

## GET by identifier

```ts
// src/api/v1/orders/[code]/get.ts
import { base_endpoint } from "@/api/helpers/base-endpoint";
import { ErrorSchema } from "@/api/schemas/common.schema";
import type { ServiceRegistry } from "@/controllers/ServiceRegistry";
import { SWAGGER_TAGS } from "@/network/http/tags";
import { OrderSchema } from "@/services/orders/dto/Order";
import z from "zod";

export const get_order_by_code = (service_registry: ServiceRegistry) =>
  base_endpoint(service_registry).get(
    "/v1/orders/:code",
    async ({ params, service_registry }) => {
      const res = await service_registry.orders_service.get_order_by_code(params.code);

      if (res.isErr()) {
        throw res.error; // service returns NotFoundError on miss → middleware emits 404
      }

      return res.value;
    },
    {
      params: z.object({
        code: z.string().meta({ description: "The code of the order" }),
      }),
      response: {
        200: OrderSchema,
        404: ErrorSchema,
        500: ErrorSchema,
      },
      detail: {
        summary: "Get order by code",
        description: "Returns a single order by its code.",
        tags: [SWAGGER_TAGS.ORDERS],
      },
    }
  );
```

Numeric path params use `query_number()`, never `z.number()` (path params arrive as strings):

```ts
params: z.object({ id: query_number() }),
```

## POST create — protected

```ts
// src/api/v1/orders/post.ts
import { protected_endpoint } from "@/api/helpers/protected-endpoint";
import { ErrorSchema } from "@/api/schemas/common.schema";
import type { ServiceRegistry } from "@/controllers/ServiceRegistry";
import { SWAGGER_TAGS } from "@/network/http/tags";
import { NewOrderSchema, OrderSchema } from "@/services/orders/dto/Order";

export const post_orders = (service_registry: ServiceRegistry) =>
  protected_endpoint(service_registry, { permissions: ["orders:write"] }).post(
    "/v1/orders",
    async ({ body, service_registry }) => {
      const res = await service_registry.orders_service.add_order(body);

      if (res.isErr()) {
        throw res.error; // ConflictError on duplicate code → 409
      }

      return res.value; // ✅ direct return — never status(201, ...)
    },
    {
      body: NewOrderSchema,
      response: {
        200: OrderSchema,
        409: ErrorSchema,
        500: ErrorSchema,
      },
      detail: {
        summary: "Create a new order",
        description: "Creates a new order.",
        tags: [SWAGGER_TAGS.ORDERS],
      },
    }
  );
```

## PATCH update — protected

```ts
// src/api/v1/orders/[code]/patch.ts
import { protected_endpoint } from "@/api/helpers/protected-endpoint";
import { ErrorSchema } from "@/api/schemas/common.schema";
import type { ServiceRegistry } from "@/controllers/ServiceRegistry";
import { SWAGGER_TAGS } from "@/network/http/tags";
import { OrderSchema, UpdateOrderSchema } from "@/services/orders/dto/Order";
import z from "zod";

export const patch_order = (service_registry: ServiceRegistry) =>
  protected_endpoint(service_registry, { permissions: ["orders:write"] }).patch(
    "/v1/orders/:code",
    async ({ params, body, service_registry }) => {
      const res = await service_registry.orders_service.update_order(params.code, body);

      if (res.isErr()) {
        throw res.error;
      }

      return res.value;
    },
    {
      params: z.object({
        code: z.string().meta({ description: "The code of the order to update" }),
      }),
      body: UpdateOrderSchema, // partial fields + refine("at least one field") — see dto-conventions
      response: {
        200: OrderSchema,
        404: ErrorSchema,
        500: ErrorSchema,
      },
      detail: {
        summary: "Update order",
        description: "Updates the mutable fields of an order.",
        tags: [SWAGGER_TAGS.ORDERS],
      },
    }
  );
```

## DELETE — protected

```ts
// src/api/v1/orders/[code]/delete.ts
import { protected_endpoint } from "@/api/helpers/protected-endpoint";
import { ErrorSchema } from "@/api/schemas/common.schema";
import type { ServiceRegistry } from "@/controllers/ServiceRegistry";
import { SWAGGER_TAGS } from "@/network/http/tags";
import z from "zod";

export const delete_order_by_code = (service_registry: ServiceRegistry) =>
  protected_endpoint(service_registry, { permissions: ["orders:write"] }).delete(
    "/v1/orders/:code",
    async ({ params, service_registry }) => {
      const res = await service_registry.orders_service.delete_order(params.code);

      if (res.isErr()) {
        throw res.error;
      }

      return { success: true };
    },
    {
      params: z.object({
        code: z.string().meta({ description: "The code of the order to delete" }),
      }),
      response: {
        200: z.object({ success: z.boolean() }),
        404: ErrorSchema,
        500: ErrorSchema,
      },
      detail: {
        summary: "Delete order",
        description: "Deletes an order by its code.",
        tags: [SWAGGER_TAGS.ORDERS],
      },
    }
  );
```

## Action endpoint — non-CRUD operation

Verb as a sub-path, always POST. The handler may compose two service calls (fetch state → act), but decision logic stays in the service.

```ts
// src/api/v1/orders/[code]/cancel/post.ts
import { protected_endpoint } from "@/api/helpers/protected-endpoint";
import { ErrorSchema } from "@/api/schemas/common.schema";
import type { ServiceRegistry } from "@/controllers/ServiceRegistry";
import { NotFoundError } from "@/errors/domain/NotFoundError";
import { SWAGGER_TAGS } from "@/network/http/tags";
import { OrderSchema } from "@/services/orders/dto/Order";
import z from "zod";

export const post_cancel_order = (service_registry: ServiceRegistry) =>
  protected_endpoint(service_registry, { permissions: ["orders:write"] }).post(
    "/v1/orders/:code/cancel",
    async ({ params, body, service_registry }) => {
      const order = await service_registry.orders_service.get_order_by_code(params.code);
      if (order.isErr()) {
        throw order.error;
      }
      if (order.value === undefined) {
        // ✅ typed domain error → 404. ❌ never `throw new Error(...)` → would become 500
        throw new NotFoundError("Order", params.code);
      }

      const res = await service_registry.orders_service.cancel_order(order.value, { reason: body.reason });
      if (res.isErr()) {
        throw res.error;
      }

      return res.value;
    },
    {
      params: z.object({ code: z.string().meta({ description: "The code of the order to cancel" }) }),
      body: z.object({ reason: z.string().optional().meta({ description: "Why the order is cancelled" }) }),
      response: {
        200: OrderSchema,
        404: ErrorSchema,
        500: ErrorSchema,
      },
      detail: {
        summary: "Cancel an order",
        description: "Cancels an order and releases its reserved stock.",
        tags: [SWAGGER_TAGS.ORDERS],
      },
    }
  );
```

## route.ts aggregator

```ts
// src/api/v1/orders/route.ts
import { with_service_registry } from "@/api/plugins/with-service-registry";
import { delete_order_by_code } from "@/api/v1/orders/[code]/delete";
import { get_order_by_code } from "@/api/v1/orders/[code]/get";
import { patch_order } from "@/api/v1/orders/[code]/patch";
import { post_cancel_order } from "@/api/v1/orders/[code]/cancel/post";
import { get_orders } from "@/api/v1/orders/get";
import { post_orders } from "@/api/v1/orders/post";
import type { ServiceRegistry } from "@/controllers/ServiceRegistry";
import Elysia from "elysia";

export const orders_routes = (service_registry: ServiceRegistry) =>
  new Elysia()
    .use(with_service_registry(service_registry))
    .use(get_orders(service_registry))
    .use(get_order_by_code(service_registry))
    .use(post_orders(service_registry))
    .use(patch_order(service_registry))
    .use(post_cancel_order(service_registry))
    .use(delete_order_by_code(service_registry));
```

Then register `orders_routes(service_registry)` in the central route registrar next to the other `*_routes` plugins.
