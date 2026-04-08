import { describe, it, expect, vi, beforeEach } from "vitest";
import { createAuditLogger, type AuditLogger } from "@/lib/audit-logger";
import type { AuditAction, AuditActor, AuditTarget } from "@/types/audit";

const mockActor: AuditActor = {
  email: "jane.doe@caireinc.com",
  name: "Jane Doe",
  entraId: "abc-123",
};

const mockTarget: AuditTarget = {
  eventId: "AAMk-event-1",
  subject: "Exec Standup",
  room: "Boardroom A",
  roomEmail: "boardroom-a@caireinc.com",
  organizer: "s.martinez@caireinc.com",
  startTime: "2026-04-07T09:30:00.000Z",
  endTime: "2026-04-07T11:00:00.000Z",
};

describe("AuditLogger", () => {
  let logger: AuditLogger;
  let writtenEntries: string[];

  beforeEach(() => {
    writtenEntries = [];
    const mockWriter = {
      write: (entry: string) => {
        writtenEntries.push(entry);
      },
    };
    logger = createAuditLogger(mockWriter);
  });

  it("logs a cancel_meeting action", () => {
    logger.log("cancel_meeting", mockActor, mockTarget, "success", null);
    expect(writtenEntries).toHaveLength(1);
    const parsed = JSON.parse(writtenEntries[0]);
    expect(parsed.action).toBe("cancel_meeting");
    expect(parsed.actor.email).toBe("jane.doe@caireinc.com");
    expect(parsed.result).toBe("success");
    expect(parsed.error).toBeNull();
  });

  it("logs a failure with error message", () => {
    logger.log("quick_book", mockActor, mockTarget, "failure", "409 Conflict");
    const parsed = JSON.parse(writtenEntries[0]);
    expect(parsed.result).toBe("failure");
    expect(parsed.error).toBe("409 Conflict");
  });

  it("includes ISO timestamp", () => {
    logger.log("decline_room", mockActor, mockTarget, "success", null);
    const parsed = JSON.parse(writtenEntries[0]);
    expect(parsed.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });
});
