import { LoggerManager, transaction_ctx } from "@/utils/logger/LoggerManager";

transaction_ctx.run({ transaction_id: 1 }, () => {
  LoggerManager.get_base_logger().info("test");
});
