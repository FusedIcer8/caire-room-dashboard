import type { AuditAction, AuditActor, AuditTarget, AuditEntry } from "@/types/audit";
import pino from "pino";
import fs from "fs";
import path from "path";

export interface LogWriter {
  write(entry: string): void;
}

export interface AuditLogger {
  log(
    action: AuditAction,
    actor: AuditActor,
    target: AuditTarget,
    result: "success" | "failure",
    error: string | null,
  ): void;
}

export function createAuditLogger(writers: LogWriter[]): AuditLogger {
  return {
    log(action, actor, target, result, error) {
      const entry: AuditEntry = {
        timestamp: new Date().toISOString(),
        action,
        actor,
        target,
        result,
        error,
      };
      const line = JSON.stringify(entry);
      for (const writer of writers) {
        try {
          writer.write(line);
        } catch {
          // never let a log writer crash the app
        }
      }
    },
  };
}

// --- stdout writer (pino) ---
const pinoLogger = pino({ name: "room-dashboard-audit", level: "info" });

export const pinoWriter: LogWriter = {
  write(entry: string) {
    pinoLogger.info(JSON.parse(entry), "audit");
  },
};

// --- file writer ---
// Writes NDJSON to /app/logs/audit-YYYY-MM-DD.log (one file per day)
// Mount /app/logs as a Docker volume for persistence.
function getLogPath(): string {
  const dir = process.env.AUDIT_LOG_DIR ?? "/app/logs";
  const date = new Date().toISOString().slice(0, 10);
  return path.join(dir, `audit-${date}.log`);
}

function ensureLogDir(): void {
  const dir = process.env.AUDIT_LOG_DIR ?? "/app/logs";
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

export const fileWriter: LogWriter = {
  write(entry: string) {
    ensureLogDir();
    fs.appendFileSync(getLogPath(), entry + "\n", "utf8");
  },
};

// --- combined logger (stdout + file) ---
export const auditLogger = createAuditLogger([pinoWriter, fileWriter]);
