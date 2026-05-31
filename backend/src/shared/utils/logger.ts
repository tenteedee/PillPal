type LogContext = Record<string, unknown>;

function write(
  level: "info" | "warn" | "error",
  message: string,
  context?: unknown,
): void {
  const payload: LogContext = {
    level,
    message,
    time: new Date().toISOString(),
  };

  if (context !== undefined) {
    payload.context = context;
  }

  process.stdout.write(`${JSON.stringify(payload)}\n`);
}

export const logger = {
  info: (message: string, context?: unknown): void =>
    write("info", message, context),
  warn: (message: string, context?: unknown): void =>
    write("warn", message, context),
  error: (message: string, context?: unknown): void =>
    write("error", message, context),
};
