import { _rootdir } from "@/_rootdir";
import { ConfigLoader } from "@/configs/ConfigLoader";
import { Controller } from "@/controllers/Controller";
import { DatabaseManager } from "@/database/DatabaseManager";
import { UserManagerHttpClient } from "@/interfaces/user-manager/UserManagerHttpClient";
import { Model } from "@/models/Model";
import { BaseHttpServer } from "@/network/http/BaseHttpServer";
import { BaseMqttClient } from "@/network/mqtt/BaseMqttClient";
import { logger } from "@/utils/logger/logger";
import { version } from "@/version";
import { join } from "path";

async function main() {
  process.on("uncaughtException", (err) => {
    // log the exception
    logger.fatal(err, "uncaught exception detected");

    // If a graceful shutdown is not achieved after 1 second,
    // shut down the process completely
    setTimeout(() => {
      process.abort(); // exit immediately and generate a core dump file
    }, 1000).unref();
    process.exit(1);
  });

  process.on("SIGTERM", async () => {
    logger.flush(); // Force buffer flush
    process.exit(0);
  });

  const config_path = join(_rootdir, "configs", "config.yaml");
  const config = await ConfigLoader.load(config_path);

  const service = "replace-name";

  logger.info("-".repeat(50));
  logger.info(` ***${service}*** v${version} started`);
  logger.info("-".repeat(50));

  logger.info(config, "Loaded configuration:");

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
    logger.error(err, "Failed to initialize controller: ");
    process.exit(0);
  }
  try {
    controller.run();
  } catch (err) {
    logger.error(err, "Error while running controller: ");
    process.exit(0);
  }
}

main();
