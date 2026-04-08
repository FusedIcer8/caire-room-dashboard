"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import { useIsAuthenticated } from "@azure/msal-react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { RoomSidebar } from "@/components/room-sidebar";
import { TimelineView } from "@/components/timeline-view";
import { DailyView } from "@/components/daily-view";
import { WeeklyView } from "@/components/weekly-view";
import { EventDetailPanel } from "@/components/event-detail-panel";
import { QuickBookPanel } from "@/components/quick-book-panel";
import { useRooms } from "@/hooks/use-rooms";
import { useRoomCalendar } from "@/hooks/use-room-calendar";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/components/toast-provider";
import type { RoomEvent } from "@/types/event";
import type { Room } from "@/types/room";

type PanelState =
  | { type: "none" }
  | { type: "event-detail"; event: RoomEvent }
  | { type: "quick-book"; room: Room; startTime: Date };

export default function DashboardPage() {
  const isAuthenticated = useIsAuthenticated();
  const router = useRouter();
  const { account, userName, userEmail } = useAuth();
  const { showToast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [minCapacity, setMinCapacity] = useState(1);
  const [panel, setPanel] = useState<PanelState>({ type: "none" });

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, router]);

  const { data: roomData } = useRooms();

  const allRooms = useMemo(
    () => roomData?.groups.flatMap((g) => g.rooms) ?? [],
    [roomData],
  );

  const roomEmails = useMemo(
    () => allRooms.map((r) => r.emailAddress),
    [allRooms],
  );

  const today = new Date();
  const startDate = new Date(today);
  startDate.setHours(0, 0, 0, 0);
  const endDate = new Date(today);
  endDate.setHours(23, 59, 59, 999);

  const { events, refresh } = useRoomCalendar({
    roomEmails,
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
  });

  const actorInfo = {
    email: userEmail ?? "",
    name: userName ?? "",
    entraId: account?.localAccountId ?? "",
  };

  const handleEventClick = useCallback((event: RoomEvent) => {
    setPanel({ type: "event-detail", event });
  }, []);

  const handleEmptySlotClick = useCallback(
    (roomEmail: string, time: Date) => {
      const room = allRooms.find((r) => r.emailAddress === roomEmail);
      if (room) {
        setPanel({ type: "quick-book", room, startTime: time });
      }
    },
    [allRooms],
  );

  const handleCancelMeeting = useCallback(
    async (event: RoomEvent) => {
      const response = await fetch(
        `/api/events/${encodeURIComponent(event.id)}/cancel`,
        {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            organizerEmail: event.organizer.email,
            actor: actorInfo,
            target: {
              eventId: event.id,
              subject: event.subject,
              room: event.roomName,
              roomEmail: event.roomEmail,
              organizer: event.organizer.email,
              startTime: event.start.dateTime,
              endTime: event.end.dateTime,
            },
          }),
        },
      );
      if (response.ok) {
        showToast("Meeting cancelled successfully", "success");
        await refresh();
      } else {
        showToast("Failed to cancel meeting", "error");
      }
    },
    [actorInfo, refresh, showToast],
  );

  const handleFreeRoom = useCallback(
    async (event: RoomEvent) => {
      const response = await fetch(
        `/api/events/${encodeURIComponent(event.id)}/decline`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            roomEmail: event.roomEmail,
            actor: actorInfo,
            target: {
              eventId: event.id,
              subject: event.subject,
              room: event.roomName,
              roomEmail: event.roomEmail,
              organizer: event.organizer.email,
              startTime: event.start.dateTime,
              endTime: event.end.dateTime,
            },
          }),
        },
      );
      if (response.ok) {
        showToast("Room freed successfully", "success");
        await refresh();
      } else {
        showToast("Failed to free room", "error");
      }
    },
    [actorInfo, refresh, showToast],
  );

  const handleQuickBook = useCallback(
    async (data: {
      roomEmail: string;
      subject: string;
      startTime: string;
      endTime: string;
      onBehalfOf?: string;
      note?: string;
    }) => {
      const response = await fetch(
        `/api/rooms/${encodeURIComponent(data.roomEmail)}/quick-book`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            booking: {
              subject: data.subject,
              startTime: data.startTime,
              endTime: data.endTime,
              timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
              onBehalfOf: data.onBehalfOf,
              note: data.note,
            },
            actor: actorInfo,
          }),
        },
      );
      if (response.ok) {
        showToast("Room booked successfully", "success");
        await refresh();
      } else {
        const body = await response.json();
        throw new Error(body.error ?? "Failed to book room");
      }
    },
    [actorInfo, refresh, showToast],
  );

  if (!isAuthenticated) return null;

  const panelNode =
    panel.type === "event-detail" ? (
      <EventDetailPanel
        event={panel.event}
        onClose={() => setPanel({ type: "none" })}
        onCancelMeeting={handleCancelMeeting}
        onFreeRoom={handleFreeRoom}
      />
    ) : panel.type === "quick-book" ? (
      <QuickBookPanel
        room={panel.room}
        initialDate={today}
        initialStartTime={panel.startTime}
        onClose={() => setPanel({ type: "none" })}
        onBook={handleQuickBook}
      />
    ) : null;

  return (
    <AppShell
      sidebar={
        <RoomSidebar
          data={roomData}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          minCapacity={minCapacity}
          onMinCapacityChange={setMinCapacity}
        />
      }
      panel={panelNode}
    >
      {(viewMode) => {
        if (viewMode === "timeline") {
          return (
            <TimelineView
              rooms={allRooms}
              events={events}
              onEventClick={handleEventClick}
              onEmptySlotClick={handleEmptySlotClick}
            />
          );
        }
        if (viewMode === "daily") {
          return (
            <DailyView
              rooms={allRooms}
              events={events}
              onEventClick={handleEventClick}
              onEmptySlotClick={handleEmptySlotClick}
            />
          );
        }
        if (viewMode === "weekly") {
          return (
            <WeeklyView
              rooms={allRooms}
              events={events}
              onEventClick={handleEventClick}
              onEmptySlotClick={handleEmptySlotClick}
            />
          );
        }
        return null;
      }}
    </AppShell>
  );
}
