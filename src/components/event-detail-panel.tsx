"use client";

import { useState } from "react";
import type { RoomEvent, EventStatus } from "@/types/event";
import { ConfirmationDialog } from "./confirmation-dialog";

interface EventDetailPanelProps {
  readonly event: RoomEvent;
  readonly onClose: () => void;
  readonly onCancelMeeting: (event: RoomEvent) => Promise<void>;
  readonly onFreeRoom: (event: RoomEvent) => Promise<void>;
}

function getEventStatus(event: RoomEvent): EventStatus {
  const now = new Date();
  const start = new Date(event.start.dateTime);
  const end = new Date(event.end.dateTime);
  if (start <= now && end >= now) return "in-progress";
  if (start > now) return "upcoming";
  return "past";
}

function formatDuration(start: string, end: string): string {
  const ms = new Date(end).getTime() - new Date(start).getTime();
  const minutes = Math.round(ms / 60000);
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const remaining = minutes % 60;
  return remaining > 0 ? `${hours} hr ${remaining} min` : `${hours} hr`;
}

function formatTime(dateTime: string): string {
  return new Date(dateTime).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

const statusConfig = {
  "in-progress": {
    label: "IN PROGRESS",
    color: "text-amber-400",
    dot: "bg-amber-400",
  },
  upcoming: {
    label: "UPCOMING",
    color: "text-indigo-400",
    dot: "bg-indigo-400",
  },
  past: { label: "ENDED", color: "text-gray-500", dot: "bg-gray-500" },
} as const;

export function EventDetailPanel({
  event,
  onClose,
  onCancelMeeting,
  onFreeRoom,
}: EventDetailPanelProps) {
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [freeDialogOpen, setFreeDialogOpen] = useState(false);
  const [isActing, setIsActing] = useState(false);

  const status = getEventStatus(event);
  const config = statusConfig[status];
  const attendeeCount = event.attendees.length;
  const visibleAttendees = event.attendees.slice(0, 3);
  const hiddenCount = attendeeCount - 3;

  const handleCancel = async () => {
    setIsActing(true);
    await onCancelMeeting(event);
    setIsActing(false);
    setCancelDialogOpen(false);
    onClose();
  };

  const handleFreeRoom = async () => {
    setIsActing(true);
    await onFreeRoom(event);
    setIsActing(false);
    setFreeDialogOpen(false);
    onClose();
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-[#2a2a3a] px-5 py-4">
        <div className="flex items-center gap-2">
          <div
            className={`h-2.5 w-2.5 rounded-full ${config.dot} ${status === "in-progress" ? "animate-pulse" : ""}`}
          />
          <span className={`text-xs font-semibold ${config.color}`}>
            {config.label}
          </span>
        </div>
        <button
          onClick={onClose}
          className="flex h-7 w-7 items-center justify-center rounded-md bg-[#1a1a2e] text-gray-500 hover:text-gray-300"
        >
          ✕
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-5">
        <h2 className="mb-1 text-xl font-bold text-white">{event.subject}</h2>
        {event.isRecurring && (
          <p className="mb-5 text-sm text-gray-500">Recurring meeting</p>
        )}

        <div className="mb-5 flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-300">
              {formatTime(event.start.dateTime)} —{" "}
              {formatTime(event.end.dateTime)}
            </span>
            <span className="text-xs text-gray-600">
              {formatDuration(event.start.dateTime, event.end.dateTime)}
            </span>
          </div>
          <div className="text-sm text-gray-300">{event.roomName}</div>
        </div>

        <div className="mb-5">
          <div className="mb-2 text-[10px] font-bold uppercase tracking-wider text-indigo-400">
            Organizer
          </div>
          <div className="rounded-lg bg-[#1a1a2e] p-3">
            <div className="text-sm text-gray-200">{event.organizer.name}</div>
            <div className="text-xs text-gray-500">{event.organizer.email}</div>
          </div>
        </div>

        <div className="mb-5">
          <div className="mb-2 text-[10px] font-bold uppercase tracking-wider text-indigo-400">
            Attendees ({attendeeCount})
          </div>
          <div className="flex flex-col gap-1.5">
            {visibleAttendees.map((a) => (
              <div
                key={a.email}
                className="flex items-center justify-between rounded-md bg-[#1a1a2e] px-3 py-2"
              >
                <span className="text-sm text-gray-300">{a.name}</span>
                <span
                  className={`text-[10px] ${
                    a.response === "accepted"
                      ? "text-emerald-400"
                      : a.response === "tentative"
                        ? "text-amber-400"
                        : a.response === "declined"
                          ? "text-red-400"
                          : "text-gray-500"
                  }`}
                >
                  {a.response === "accepted"
                    ? "Accepted"
                    : a.response === "tentative"
                      ? "Tentative"
                      : a.response === "declined"
                        ? "Declined"
                        : "No response"}
                </span>
              </div>
            ))}
            {hiddenCount > 0 && (
              <div className="px-3 text-xs text-gray-600">
                + {hiddenCount} more
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="border-t border-[#2a2a3a] bg-[#0f0f18] px-5 py-4">
        <div className="flex flex-col gap-2">
          <button
            disabled={isActing}
            onClick={() => setCancelDialogOpen(true)}
            className="w-full rounded-lg bg-red-600 py-3 text-sm font-semibold text-white hover:bg-red-500 disabled:opacity-50"
          >
            Cancel Entire Meeting
          </button>
          <button
            disabled={isActing}
            onClick={() => setFreeDialogOpen(true)}
            className="w-full rounded-lg bg-amber-600 py-3 text-sm font-semibold text-black hover:bg-amber-500 disabled:opacity-50"
          >
            Free Room Only
          </button>
          <p className="mt-1 text-center text-[10px] text-gray-600">
            Actions are logged for audit. Attendees will be notified.
          </p>
        </div>
      </div>

      <ConfirmationDialog
        open={cancelDialogOpen}
        onOpenChange={setCancelDialogOpen}
        title="Cancel Meeting"
        description={`This will cancel "${event.subject}" for all ${attendeeCount} attendees and free ${event.roomName}. The organizer (${event.organizer.name}) and all attendees will receive a cancellation notice. This cannot be undone.`}
        confirmLabel="Yes, Cancel Meeting"
        confirmVariant="danger"
        onConfirm={handleCancel}
      />

      <ConfirmationDialog
        open={freeDialogOpen}
        onOpenChange={setFreeDialogOpen}
        title="Free Room"
        description={`This will remove ${event.roomName} from "${event.subject}". The meeting will continue without a room. The organizer (${event.organizer.name}) will be notified.`}
        confirmLabel="Yes, Free Room"
        confirmVariant="warning"
        onConfirm={handleFreeRoom}
      />
    </div>
  );
}
