import { NextRequest, NextResponse } from "next/server";
import { getGraphClient } from "@/lib/graph-client";
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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ roomId: string }> },
) {
  try {
    const { roomId } = await params;
    const searchParams = request.nextUrl.searchParams;
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: "startDate and endDate query params are required" },
        { status: 400 },
      );
    }

    const client = await getGraphClient();
    const response = await client
      .api(`/users/${roomId}/calendarView`)
      .query({ startDateTime: startDate, endDateTime: endDate })
      .select([
        "id",
        "subject",
        "start",
        "end",
        "organizer",
        "attendees",
        "isAllDay",
        "type",
        "location",
      ])
      .top(100)
      .get();

    const events: RoomEvent[] = (
      (response.value ?? []) as Record<string, unknown>[]
    ).map((e) => mapGraphEventToRoomEvent(e, roomId, ""));

    return NextResponse.json({ events });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const isMailboxUnavailable =
      message.includes("inactive") ||
      message.includes("soft-deleted") ||
      message.includes("on-premise") ||
      message.includes("MailboxNotEnabledForRESTAPI");
    if (isMailboxUnavailable) {
      console.warn(`Skipping unavailable mailbox: ${message}`);
      return NextResponse.json({ events: [] });
    }
    console.error("Failed to fetch room calendar:", error);
    return NextResponse.json(
      { error: "Failed to fetch room calendar" },
      { status: 500 },
    );
  }
}
