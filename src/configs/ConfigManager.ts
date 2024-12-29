import yaml from "yaml";
import { z } from "zod";

// Global Config Schema
const GlobalConfigSchema = z.object({});

// Main Config Schema
const ConfigSchema = z.object({
	version: z.string(),
	global: GlobalConfigSchema,
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

		return res;
	}
}
