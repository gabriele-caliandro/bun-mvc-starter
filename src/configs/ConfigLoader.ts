import { join } from "path";
import ConfigSchema, { type Config } from "@/configs/config.schema";
import { _rootdir } from "@/main";
import yaml from "yaml";

export class ConfigLoader {
  private static instance: Config | null = null;

  static async load(): Promise<Config> {
    if (this.instance) return this.instance;

    // Load base configuration
    const configFile = Bun.file(join(_rootdir, "config", "config.yaml"));
    const content = await configFile.text();
    const config = yaml.parse(content);

    // Validate
    const result = ConfigSchema.safeParse(config);
    if (!result.success) {
      console.error("❌ Configuration validation failed:");
      console.error(result.error.format());
      process.exit(1);
    }

    this.instance = result.data;
    return this.instance;
  }
}
