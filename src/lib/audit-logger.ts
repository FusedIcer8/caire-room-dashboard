import type { AuditAction, AuditActor, AuditTarget, AuditEntry } from "@/types/audit";

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

export function createAuditLogger(writer: LogWriter): AuditLogger {
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
      writer.write(JSON.stringify(entry));
    },
  };
}

import pino from "pino";

const pinoLogger = pino({
  name: "room-dashboard-audit",
  level: "info",
});

export const pinoWriter: LogWriter = {
  write(entry: string) {
    pinoLogger.info(JSON.parse(entry), "audit");
  },
};

export const auditLogger = createAuditLogger(pinoWriter);
