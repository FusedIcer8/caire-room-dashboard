export interface EventTime {
  readonly dateTime: string;
  readonly timeZone: string;
}

export interface EventAttendee {
  readonly email: string;
  readonly name: string;
  readonly response: "accepted" | "tentative" | "declined" | "none";
  readonly type: "required" | "optional" | "resource";
}

export interface EventOrganizer {
  readonly email: string;
  readonly name: string;
}

export interface RoomEvent {
  readonly id: string;
  readonly subject: string;
  readonly start: EventTime;
  readonly end: EventTime;
  readonly organizer: EventOrganizer;
  readonly attendees: readonly EventAttendee[];
  readonly isAllDay: boolean;
  readonly isRecurring: boolean;
  readonly roomEmail: string;
  readonly roomName: string;
}

export type EventStatus = "in-progress" | "upcoming" | "past";

export interface QuickBookRequest {
  readonly subject: string;
  readonly startTime: string;
  readonly endTime: string;
  readonly timeZone: string;
  readonly onBehalfOf?: string;
  readonly note?: string;
}

export interface CalendarViewParams {
  readonly startDate: string;
  readonly endDate: string;
}
