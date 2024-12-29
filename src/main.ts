import { ConfigManager } from "@/configs/ConfigManager";
import { Controller } from "@/controllers/Controller";
import { Model } from "@/models/Model";
import { ServerHttp } from "@/network/http/ServerHttp";
import { LoggerManager } from "@/utils/logger/LoggerManager";
import { join } from "path";

export const ROOT_DIR = import.meta.dir.replace("/src", "");

const configFilePath = join(ROOT_DIR, "config.yaml");
const configFile = Bun.file(configFilePath);
const text = await configFile.text();
export const config = await ConfigManager.init(text);

async function main() {
  const logger = await LoggerManager.createLogger();

  logger.breakLine();
  logger.spacer("=");
  logger.info(` ***REPLACE_NAME*** v${config.version} started`);
  logger.spacer("=");
  logger.breakLine();

  logger.info(`Loaded configuration: ${configFilePath}`, { config });

  const DEFAULT_PORT = 8080;
  const DEFAULT_PREFIX = "";
  const serverHttp = new ServerHttp(config.http.port ?? DEFAULT_PORT, config.http.prefix ?? DEFAULT_PREFIX);
  const model = new Model(["foo", "bar"]);
  const controller = new Controller(model, serverHttp);

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
