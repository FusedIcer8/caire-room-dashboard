import { NextRequest, NextResponse } from "next/server";
import { getGraphClient } from "@/lib/graph-client";
import { auditLogger } from "@/lib/audit-logger";
import type { AuditActor, AuditTarget } from "@/types/audit";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ eventId: string }> },
) {
  try {
    const { eventId } = await params;
    const body: unknown = await request.json();
    const { organizerEmail, actor, target } = body as {
      organizerEmail: string;
      actor: AuditActor;
      target: AuditTarget;
    };

    if (!organizerEmail || !eventId) {
      return NextResponse.json(
        { error: "organizerEmail and eventId are required" },
        { status: 400 },
      );
    }

    const client = await getGraphClient();
    auditLogger.log("cancel_meeting", actor, target, "success", null);

    await client
      .api(`/users/${organizerEmail}/events/${eventId}`)
      .delete();

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error("Failed to cancel meeting:", error);
    const message =
      error instanceof Error ? error.message : "Failed to cancel meeting";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
