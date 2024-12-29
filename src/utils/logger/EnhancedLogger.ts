import type { LogLevel } from "@/utils/logger/LoggerManager";
import winston from "winston";

/**
 * Enhanced logger interface.
 * It's a winston logger with some additional methods.
 * @see @type {import('@/utils/logger/LoggerManager').LoggerManager}
 */
export interface EnhancedLogger extends winston.Logger {
	breakLine(): void;
	spacer(char: string, lvl?: LogLevel, length?: number): void;
}
