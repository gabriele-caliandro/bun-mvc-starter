import { CommandLineConfig } from "@/configs/CommandLineConfig";
import yaml from "yaml";
import { z } from "zod";

// Global Config Schema
const GlobalConfigSchema = z.object({}).nullish();
const HttpConfigSchema = z.object({
  port: z.number().nullish(),
  prefix: z.string().nullish(),
});

// Main Config Schema
const ConfigSchema = z.object({
  version: z.string(),
  global: GlobalConfigSchema,
  http: HttpConfigSchema,
});

// Type inference
export type Config = z.infer<typeof ConfigSchema>;
export type GlobalConfig = z.infer<typeof GlobalConfigSchema>;

export class ConfigManager {
  /**
   * @param text Config file string in yaml format
   */
  static async init(text: string): Promise<Config> {
    const config: Config = yaml.parse(text);

    return ConfigManager.validateConfig(config);
  }

  private static async validateConfig(config: Config) {
    let res: Config = config;

    res = ConfigSchema.parse(config) as Config;

    res = ConfigManager.injectCommandLineArguments(res);

    return res;
  }

  /**
   * Injects command line arguments into the config object overriding any existing values
   * @param config
   */
  private static injectCommandLineArguments(config: Config): Config {
    const commandLineConfig = CommandLineConfig.instance;

    if (commandLineConfig.example) {
      /* Set example config */
    }

    return config;
  }
}
