import { getErrorMessage } from "@/utils/get-error-message";
import winston from "winston";

/**
 * Logger format used for console
 */
const consoleFormat = winston.format.combine(
  timestampFormat(),
  // winston.format.align(),
  winston.format.errors({ stack: true }),
  baseFormat(),
  winston.format.colorize({
    all: true,
    colors: {
      info: "green",
      warn: "yellow",
      error: "red",
      debug: "blue",
    },
  })
);

/**
 * Logger format used for file
 */
const prettyFileFormat = winston.format.combine(
  timestampFormat(),
  // winston.format.align(),
  winston.format.errors({ stack: true }),
  baseFormat()
);

export const formats = {
  prettyFile: prettyFileFormat,
  console: consoleFormat,
};

function timestampFormat() {
  return winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss.SSS" });
}

/**
 * Base format that will be shared between all transports.
 * @returns
 */
function baseFormat() {
  return winston.format.printf(({ timestamp, level, message, service, err, error, prefixes, ...metadata }) => {
    // Remove internal winston metadata
    const cleanMetadata = filterMetadata(metadata);

    // Base log string
    let logString = "";
    if (metadata.noTimestamp !== true) {
      logString += `[${timestamp}] `;
    }
    if (metadata.noLvl !== true) {
      logString += `[${level.toUpperCase()}] `;
    }
    if (metadata.noService !== true) {
      logString += `[${service}] `;
    }
    logString += message;

    // Add metadata on new line if present
    if (Object.keys(cleanMetadata).length > 0) {
      logString += `\n${JSON.stringify(cleanMetadata, null, 2)}`;
    }

    if (prefixes !== undefined && prefixes !== null) {
      try {
        logString += (prefixes as string[]).map((prefix) => `[${prefix}] `).join("");
      } catch (_) {
        /* empty */
      }
    }

    if (err) {
      logString += `\n${getErrorMessage(err)}`;
    }
    if (error) {
      logString += `\n${getErrorMessage(err)}`;
    }

    return logString;
  });
}

function filterMetadata(metadata: Record<string, unknown>): Record<string, unknown> {
  const keysToRemove = ["label", "originalLine", "originalColumn", "noTimestamp", "noLvl", "noService", "stack"];
  return Object.fromEntries(Object.entries(metadata).filter(([key]) => !keysToRemove.includes(key)));
}
