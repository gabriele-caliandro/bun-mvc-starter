import winston from "winston";

/**
 * Logger format used for console
 */
const consoleFormat = winston.format.combine(
  timestampFormat(),
  // winston.format.align(),
  winston.format.errors({ stack: true }),
  ensureErrorStack(),
  baseFormat(),
  winston.format.colorize({
    all: true,
    colors: {
      info: "green",
      warn: "yellow",
      error: "red",
      debug: "blue",
    },
  }),
);

/**
 * Logger format used for file
 */
const prettyFileFormat = winston.format.combine(
  timestampFormat(),
  // winston.format.align(),
  winston.format.errors({ stack: true }),
  ensureErrorStack(),
  baseFormat(),
);

export const formats = {
  prettyFile: prettyFileFormat,
  console: consoleFormat,
};

/**
 * In case a logger.error() was used without passing @type {Error} obj, force the creation of a stack trace
 */
function ensureErrorStack() {
  return winston.format((info) => {
    if (info.level === "error") {
      if (typeof info.message === "string" && !info.stack) {
        const e = new Error(info.message);
        info.stack = e.stack?.split("\n").slice(2).join("\n");
      }
    }
    return info;
  })();
}
function timestampFormat() {
  return winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss.SSS" });
}

/**
 * Base format that will be shared between all transports.
 * @returns
 */
function baseFormat() {
  return winston.format.printf(({ timestamp, level, message, service, stack, ...metadata }) => {
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

    // Add stack trace for errors if present
    if (stack && ["error", "warn"].includes(level)) {
      logString += `\n${stack}`;
    }

    return logString;
  });
}

function filterMetadata(metadata: Record<string, any>): Record<string, any> {
  const keysToRemove = ["label", "originalLine", "originalColumn", "noTimestamp", "noLvl", "noService"];
  return Object.fromEntries(Object.entries(metadata).filter(([key]) => !keysToRemove.includes(key)));
}
