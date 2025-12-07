import { ConfigLoader } from "@/configs/ConfigLoader";
import { Controller } from "@/controllers/Controller";
import { DatabaseManager } from "@/database/DatabaseManager";
import { BaseMqttClient } from "@/network/mqtt/BaseMqttClient";
import { _rootdir } from "@/root-dir";
import { base_logger } from "@/utils/logger/logger";
import { version } from "@/version";
import { join } from "path";

async function main() {
  process.on("uncaughtException", (err) => {
    // log the exception
    base_logger.fatal(err, "uncaught exception detected");

    // If a graceful shutdown is not achieved after 1 second,
    // shut down the process completely
    setTimeout(() => {
      process.abort(); // exit immediately and generate a core dump file
    }, 1000).unref();
    process.exit(1);
  });

  process.on("SIGTERM", async () => {
    base_logger.flush(); // Force buffer flush
    process.exit(0);
  });

  const config_path = join(_rootdir, "configs", "config.yaml");
  const config = await ConfigLoader.load(config_path);

  const service = "replace-name";

  base_logger.info("-".repeat(50));
  base_logger.info(` ***${service}*** v${version} started`);
  base_logger.info("-".repeat(50));

  base_logger.info(config, "Loaded configuration:");

  const db = new DatabaseManager(
    config.database.host,
    config.database.port,
    config.database.database,
    config.database.username,
    config.database.password
  );
  const mqtt = new BaseMqttClient(service, config.mqtt.url);

  const DEFAULT_PORT = 8080;
  const controller = new Controller(config.http.port ?? DEFAULT_PORT, {
    db,
    mqtt,
  });

  try {
    await controller.init();
  } catch (err) {
    base_logger.error(err, "Failed to initialize controller: ");
    process.exit(0);
  }
  try {
    controller.run();
  } catch (err) {
    base_logger.error(err, "Error while running controller: ");
    process.exit(0);
  }
}

main();
