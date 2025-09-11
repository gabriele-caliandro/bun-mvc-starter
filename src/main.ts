import { ConfigLoader } from "@/configs/ConfigLoader";
import { Controller } from "@/controllers/Controller";
import { DatabaseManager } from "@/database/DatabaseManager";
import { UserManagerHttpClient } from "@/interfaces/user-manager/UserManagerHttpClient";
import { Model } from "@/models/Model";
import { BaseHttpServer } from "@/network/http/BaseHttpServer";
import { BaseMqttClient } from "@/network/mqtt/BaseMqttClient";
import { LoggerManager } from "@/utils/logger/LoggerManager";
import { join } from "path";

// Gets the root directory of the project. Checks if it's in production or development mode.
export const _rootdir =
  import.meta.dir.startsWith("/$bunfs/root") || import.meta.dir.startsWith("B:\\~BUN\\root")
    ? join(process.execPath, "..", "..")
    : join(import.meta.dir, "..");

export const config = await ConfigLoader.load();
await LoggerManager.ensure_log_directory();
async function main() {
  const logger = LoggerManager.get_logger();

  const service = "replace-name";

  logger.info("-".repeat(50));
  logger.info(` ***${service}*** v${config.version} started`);
  logger.info("-".repeat(50));

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
  const mqtt = new BaseMqttClient(service, config.mqtt.url);

  const userManger = new UserManagerHttpClient(config["user-manager-http-server"].url, "user-manager");

  const controller = new Controller(model, serverHttp, {
    db,
    userManger,
    mqtt,
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
