type LogLevel = "debug" | "info" | "warn" | "error";

export interface LogContext {
  component?: string;
  operation?: string;
  tenantId?: string;
  eventId?: string | null;
  guestId?: string | null;
  provider?: string;
  status?: string | number;
  code?: string | number;
  [key: string]: string | number | boolean | null | undefined;
}

export const logger = {
  debug(message: string, context: LogContext = {}) {
    writeLog("debug", message, context);
  },
  info(message: string, context: LogContext = {}) {
    writeLog("info", message, context);
  },
  warn(message: string, context: LogContext = {}) {
    writeLog("warn", message, context);
  },
  error(message: string, context: LogContext = {}) {
    writeLog("error", message, context);
  },
};

function writeLog(level: LogLevel, message: string, context: LogContext): void {
  const payload = {
    level,
    message,
    timestamp: new Date().toISOString(),
    ...redactContext(context),
  };

  if (level === "error") {
    console.error(JSON.stringify(payload));
    return;
  }

  if (level === "warn") {
    console.warn(JSON.stringify(payload));
    return;
  }

  if (level === "debug") {
    console.debug(JSON.stringify(payload));
    return;
  }

  console.info(JSON.stringify(payload));
}

function redactContext(context: LogContext): LogContext {
  const redacted: LogContext = {};

  for (const [key, value] of Object.entries(context)) {
    if (/token|secret|key|authorization/i.test(key)) {
      redacted[key] = "[redacted]";
      continue;
    }

    redacted[key] = value;
  }

  return redacted;
}
