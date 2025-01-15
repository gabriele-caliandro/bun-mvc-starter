import { join } from "path";
import { parseArgs } from "util";

export class CommandLineConfig {
  static _c?: CommandLineConfig;
  example?: string;
  help: boolean;

  private constructor() {
    this.help = false;
  }

  static get instance() {
    if (!this._c) {
      this._c = new CommandLineConfig();
      this._c.init();
    }
    return this._c;
  }

  helpMessage() {
    return `
    Usage: bun run dev [options]
    Options:
      -e, --example <path>                Path to the example map
      -h,   --help                        Show this help message
    `;
  }

  init() {
    // Parse command line arguments
    try {
      const { values } = parseArgs({
        args: Bun.argv,
        options: {
          example: {
            default: join("config", "map.svg"),
            type: "string",
            short: "e",
          },
        },
        allowPositionals: true,
      });

      this.example = values["example"];
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (_) {
      /* empty */
    }

    if (Bun.argv.includes("--help") || Bun.argv.includes("-h")) {
      this.help = true;
    }
  }
}
