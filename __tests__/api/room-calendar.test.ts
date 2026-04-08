import { describe, it, expect } from "vitest";
import type { RoomEvent, EventAttendee } from "@/types/event";

function mapResponseStatus(
  status: string | undefined,
): "accepted" | "tentative" | "declined" | "none" {
  switch (status) {
    case "accepted":
      return "accepted";
    case "tentativelyAccepted":
      return "tentative";
    case "declined":
      return "declined";
    default:
      return "none";
  }
}

function mapGraphEventToRoomEvent(
  graphEvent: Record<string, unknown>,
  roomEmail: string,
  roomName: string,
): RoomEvent {
  const organizer = graphEvent.organizer as Record<string, unknown> | undefined;
  const organizerEmail = organizer?.emailAddress as Record<string, unknown> | undefined;
  const attendees = (graphEvent.attendees as Record<string, unknown>[] | undefined) ?? [];

  return {
    id: graphEvent.id as string,
    subject: (graphEvent.subject as string | undefined) ?? "(No subject)",
    start: graphEvent.start as RoomEvent["start"],
    end: graphEvent.end as RoomEvent["end"],
    organizer: {
      email: (organizerEmail?.address as string | undefined) ?? "",
      name: (organizerEmail?.name as string | undefined) ?? "",
    },
    attendees: attendees.map((a): EventAttendee => {
      const aEmail = a.emailAddress as Record<string, unknown> | undefined;
      const aStatus = a.status as Record<string, unknown> | undefined;
      return {
        email: (aEmail?.address as string | undefined) ?? "",
        name: (aEmail?.name as string | undefined) ?? "",
        response: mapResponseStatus(aStatus?.response as string | undefined),
        type: (a.type as EventAttendee["type"] | undefined) ?? "required",
      };
    }),
    isAllDay: (graphEvent.isAllDay as boolean | undefined) ?? false,
    isRecurring:
      graphEvent.type === "occurrence" || graphEvent.type === "seriesMaster",
    roomEmail,
    roomName,
  };
}

describe("mapResponseStatus", () => {
  it("maps accepted correctly", () => {
    expect(mapResponseStatus("accepted")).toBe("accepted");
  });

  it("maps tentativelyAccepted to tentative", () => {
    expect(mapResponseStatus("tentativelyAccepted")).toBe("tentative");
  });

  it("maps declined correctly", () => {
    expect(mapResponseStatus("declined")).toBe("declined");
  });

  it("maps unknown values to none", () => {
    expect(mapResponseStatus("notResponded")).toBe("none");
    expect(mapResponseStatus(undefined)).toBe("none");
  });
});

describe("mapGraphEventToRoomEvent", () => {
  it("maps a complete Graph event to RoomEvent", () => {
    const graphEvent = {
      id: "evt-1",
      subject: "Exec Standup",
      start: {
        dateTime: "2026-04-07T09:30:00",
        timeZone: "Eastern Standard Time",
      },
      end: {
        dateTime: "2026-04-07T11:00:00",
        timeZone: "Eastern Standard Time",
      },
      organizer: {
        emailAddress: { address: "sarah@caireinc.com", name: "Sarah M" },
      },
      attendees: [
        {
          emailAddress: { address: "james@caireinc.com", name: "James R" },
          status: { response: "accepted" },
          type: "required",
        },
        {
          emailAddress: { address: "lisa@caireinc.com", name: "Lisa K" },
          status: { response: "tentativelyAccepted" },
          type: "optional",
        },
      ],
      isAllDay: false,
      type: "occurrence",
    };
    const event = mapGraphEventToRoomEvent(
      graphEvent,
      "boardroom@caireinc.com",
      "Boardroom A",
    );
    expect(event.id).toBe("evt-1");
    expect(event.subject).toBe("Exec Standup");
    expect(event.organizer.email).toBe("sarah@caireinc.com");
    expect(event.attendees).toHaveLength(2);
    expect(event.attendees[0].response).toBe("accepted");
    expect(event.attendees[1].response).toBe("tentative");
    expect(event.isRecurring).toBe(true);
    expect(event.roomEmail).toBe("boardroom@caireinc.com");
    expect(event.roomName).toBe("Boardroom A");
  });

  it("defaults missing subject to (No subject)", () => {
    const graphEvent = {
      id: "evt-2",
      start: { dateTime: "2026-04-07T10:00:00", timeZone: "UTC" },
      end: { dateTime: "2026-04-07T11:00:00", timeZone: "UTC" },
      organizer: {
        emailAddress: { address: "x@caireinc.com", name: "X" },
      },
      attendees: [],
      isAllDay: false,
      type: "singleInstance",
    };
    const event = mapGraphEventToRoomEvent(graphEvent, "room@caireinc.com", "Room");
    expect(event.subject).toBe("(No subject)");
    expect(event.isRecurring).toBe(false);
  });

  it("treats seriesMaster as recurring", () => {
    const graphEvent = {
      id: "evt-3",
      subject: "Weekly Sync",
      start: { dateTime: "2026-04-07T14:00:00", timeZone: "UTC" },
      end: { dateTime: "2026-04-07T15:00:00", timeZone: "UTC" },
      organizer: {
        emailAddress: { address: "mgr@caireinc.com", name: "Manager" },
      },
      attendees: [],
      isAllDay: false,
      type: "seriesMaster",
    };
    const event = mapGraphEventToRoomEvent(graphEvent, "room@caireinc.com", "Room");
    expect(event.isRecurring).toBe(true);
  });

  it("defaults missing attendee type to required", () => {
    const graphEvent = {
      id: "evt-4",
      subject: "Standup",
      start: { dateTime: "2026-04-07T09:00:00", timeZone: "UTC" },
      end: { dateTime: "2026-04-07T09:15:00", timeZone: "UTC" },
      organizer: {
        emailAddress: { address: "lead@caireinc.com", name: "Lead" },
      },
      attendees: [
        {
          emailAddress: { address: "dev@caireinc.com", name: "Dev" },
          status: { response: "accepted" },
        },
      ],
      isAllDay: false,
      type: "singleInstance",
    };
    const event = mapGraphEventToRoomEvent(graphEvent, "room@caireinc.com", "Room");
    expect(event.attendees[0].type).toBe("required");
  });
});
