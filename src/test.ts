import { logger } from "@/utils/logger/logger";
import { AsyncLocalStorage } from "async_hooks";

// const ctx = new AsyncLocalStorage<{
//   req_id: number;
// }>();

setInterval(() => {
  const error = new Error("How am i formatted");
  logger.info( error, "page");
}, 2000);
