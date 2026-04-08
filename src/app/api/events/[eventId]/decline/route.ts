import { NextRequest, NextResponse } from "next/server";
import { getGraphClient } from "@/lib/graph-client";
import { auditLogger } from "@/lib/audit-logger";
import type { AuditActor, AuditTarget } from "@/types/audit";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ eventId: string }> },
) {
  try {
    const { eventId } = await params;
    const body: unknown = await request.json();
    const { roomEmail, actor, target } = body as {
      roomEmail: string;
      actor: AuditActor;
      target: AuditTarget;
    };

    if (!roomEmail || !eventId) {
      return NextResponse.json(
        { error: "roomEmail and eventId are required" },
        { status: 400 },
      );
    }

    const client = await getGraphClient();
    auditLogger.log("decline_room", actor, target, "success", null);

    await client
      .api(`/users/${roomEmail}/events/${eventId}/decline`)
      .post({
        comment: `Room freed by ${actor.name} via Room Dashboard`,
        sendResponse: true,
      });

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error("Failed to decline room:", error);
    const message =
      error instanceof Error ? error.message : "Failed to decline room";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
