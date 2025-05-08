import { CommandLineConfig } from "@/configs/CommandLineConfig";
import { ConfigManager } from "@/configs/ConfigManager";
import { Controller } from "@/controllers/Controller";
import { DatabaseManager } from "@/database/DatabaseManager";
import { UserManager } from "@/interfaces/user-manager/UserManager";
import { Model } from "@/models/Model";
import { BaseHttpServer } from "@/network/http/BaseHttpServer";
import { LoggerManager } from "@/utils/logger/LoggerManager";
import path, { join } from "path";

const _dirname =
  import.meta.dir.startsWith("/$bunfs/root") || import.meta.dir.startsWith("B:\\~BUN\\root") ? `${process.execPath}/..` : import.meta.dir;

const configFilePath = join(_dirname, "..", "config.yaml");
const configFile = Bun.file(configFilePath);
const text = await configFile.text();
export const config = await ConfigManager.init(text);

async function main() {
  // Check if help flag is set
  if (CommandLineConfig.instance.help) {
    const msg = CommandLineConfig.instance.helpMessage();
    console.log(msg);
    process.exit(0);
  }
  const logger = await LoggerManager.createLogger();

  logger.breakLine();
  logger.spacer("=");
  logger.info(` ***REPLACE_NAME*** v${config.version} started`);
  logger.spacer("=");
  logger.breakLine();

  logger.info(`Loaded configuration: ${configFilePath}`, { config });

  const DEFAULT_PORT = 8080;
  const DEFAULT_PREFIX = "";
  const serverHttp = new BaseHttpServer(config.http.port ?? DEFAULT_PORT, config.http.prefix ?? DEFAULT_PREFIX);

  const model = new Model(["foo", "bar"]);
  const db = new DatabaseManager(
    config.database.host,
    config.database.port,
    config.database.database,
    config.database.username,
    config.database.password,
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
