import type { AbstractConfigSetLevels } from "winston/lib/winston/config";

export const log_levels = {
  fatal: 0,
  error: 1,
  warn: 2,
  info: 3,
  debug: 4,
  trace: 5,
} as const satisfies AbstractConfigSetLevels;
export type LogLevel = keyof typeof log_levels;
