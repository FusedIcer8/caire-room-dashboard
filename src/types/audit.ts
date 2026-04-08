export type AuditAction = "cancel_meeting" | "decline_room" | "quick_book";

export interface AuditActor {
  readonly email: string;
  readonly name: string;
  readonly entraId: string;
}

export interface AuditTarget {
  readonly eventId: string;
  readonly subject: string;
  readonly room: string;
  readonly roomEmail: string;
  readonly organizer: string;
  readonly startTime: string;
  readonly endTime: string;
}

export interface AuditEntry {
  readonly timestamp: string;
  readonly action: AuditAction;
  readonly actor: AuditActor;
  readonly target: AuditTarget;
  readonly result: "success" | "failure";
  readonly error: string | null;
}
