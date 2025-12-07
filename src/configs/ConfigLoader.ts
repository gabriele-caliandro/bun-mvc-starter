import ConfigSchema, { type Config } from "@/configs/config.schema";
import yaml from "yaml";
import z from "zod";

export class ConfigLoader {
  private static instance: Config | null = null;

  static async load(path: string): Promise<Config> {
    if (this.instance) return this.instance;

    // Load base configuration
    const configFile = Bun.file(path);
    const content = await configFile.text();
    const config = yaml.parse(content);

    // Validate
    const result = ConfigSchema.safeParse(config);
    if (!result.success) {
      console.error("❌ Configuration validation failed:");
      console.error(z.treeifyError(result.error));
      process.exit(1);
    }

    this.instance = result.data;
    return this.instance;
  }
}
