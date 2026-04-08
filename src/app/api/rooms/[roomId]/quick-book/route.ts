import { NextRequest, NextResponse } from "next/server";
import { getGraphClient } from "@/lib/graph-client";
import { auditLogger } from "@/lib/audit-logger";
import type { QuickBookRequest } from "@/types/event";
import type { AuditActor, AuditTarget } from "@/types/audit";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ roomId: string }> },
) {
  try {
    const { roomId } = await params;
    const body: unknown = await request.json();
    const { booking, actor } = body as {
      booking: QuickBookRequest;
      actor: AuditActor;
    };

    if (!booking.subject || !booking.startTime || !booking.endTime) {
      return NextResponse.json(
        { error: "subject, startTime, and endTime are required" },
        { status: 400 },
      );
    }

    const client = await getGraphClient();

    const eventPayload = {
      subject: booking.subject,
      start: {
        dateTime: booking.startTime,
        timeZone: booking.timeZone || "Eastern Standard Time",
      },
      end: {
        dateTime: booking.endTime,
        timeZone: booking.timeZone || "Eastern Standard Time",
      },
      body: {
        contentType: "text",
        content: booking.note
          ? `${booking.note}\n\nBooked via Room Dashboard`
          : "Booked via Room Dashboard",
      },
      isOnlineMeeting: false,
    };

    const newEvent = await client
      .api(`/users/${roomId}/calendar/events`)
      .post(eventPayload);

    const target: AuditTarget = {
      eventId: newEvent.id as string,
      subject: booking.subject,
      room: roomId,
      roomEmail: roomId,
      organizer: booking.onBehalfOf ?? actor.email,
      startTime: booking.startTime,
      endTime: booking.endTime,
    };

    auditLogger.log("quick_book", actor, target, "success", null);

    return NextResponse.json({ success: true, eventId: newEvent.id as string });
  } catch (error: unknown) {
    console.error("Failed to quick-book:", error);
    const statusCode = (error as { statusCode?: number }).statusCode;
    if (statusCode === 409) {
      return NextResponse.json(
        { error: "Room was just booked by someone else. Please refresh." },
        { status: 409 },
      );
    }
    const message =
      error instanceof Error ? error.message : "Failed to book room";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
