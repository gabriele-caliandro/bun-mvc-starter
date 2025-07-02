import { ConfigLoader } from "@/configs/ConfigLoader";
import { Controller } from "@/controllers/Controller";
import { DatabaseManager } from "@/database/DatabaseManager";
import { UserManager } from "@/interfaces/user-manager/UserManager";
import { Model } from "@/models/Model";
import { BaseHttpServer } from "@/network/http/BaseHttpServer";
import { LoggerManager } from "@/utils/logger/LoggerManager";
import { join } from "path";

// Gets the root directory of the project. Checks if it's in production or development mode.
export const _rootdir =
  import.meta.dir.startsWith("/$bunfs/root") || import.meta.dir.startsWith("B:\\~BUN\\root")
    ? join(process.execPath, "..", "..")
    : join(import.meta.dir, "..");

export const config = await ConfigLoader.load();
async function main() {
  const logger = await LoggerManager.createLogger();

  logger.breakLine();
  logger.spacer("=");
  logger.info(` ***REPLACE_NAME*** v${config.version} started`);
  logger.spacer("=");
  logger.breakLine();

  logger.info(`Loaded configuration:`, { config });

  const DEFAULT_PORT = 8080;
  const DEFAULT_PREFIX = "";
  const serverHttp = new BaseHttpServer(config.http.port ?? DEFAULT_PORT, config.http.prefix ?? DEFAULT_PREFIX);

  const model = new Model(["foo", "bar"]);
  const db = new DatabaseManager(
    config.database.host,
    config.database.port,
    config.database.database,
    config.database.username,
    config.database.password
  );
  const userManger = new UserManager(config.userManager.url, "user-manager");

  const controller = new Controller(model, serverHttp, {
    db,
    userManger,
  });

  try {
    await controller.init();
  } catch (err) {
    logger.error(`Failed to initialize controller: `, err);
    process.exit(0);
  }
  try {
    controller.run();
  } catch (err) {
    logger.error(`Error while running controller: `, err);
    process.exit(0);
  }
}

main();
