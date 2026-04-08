"use client";

import { useMemo, useCallback } from "react";
import Timeline, {
  TimelineMarkers,
  TodayMarker,
  type CustomMarkerChildrenProps,
} from "react-calendar-timeline";
// CSS path for react-calendar-timeline v0.30.x
import "react-calendar-timeline/dist/style.css";
import moment from "moment";
import type { Room } from "@/types/room";
import type { RoomEvent } from "@/types/event";

interface TimelineViewProps {
  readonly rooms: readonly Room[];
  readonly events: Map<string, RoomEvent[]>;
  readonly onEventClick: (event: RoomEvent) => void;
  readonly onEmptySlotClick: (roomEmail: string, time: Date) => void;
}

function getEventColor(event: RoomEvent): string {
  const now = new Date();
  const start = new Date(event.start.dateTime);
  const end = new Date(event.end.dateTime);

  if (event.isAllDay) return "#10b981";
  if (start <= now && end >= now) return "#f59e0b";
  if (event.isRecurring) return "#a78bfa";
  return "#6366f1";
}

export function TimelineView({
  rooms,
  events,
  onEventClick,
  onEmptySlotClick,
}: TimelineViewProps) {
  const groups = useMemo(
    () =>
      rooms.map((room) => ({
        id: room.emailAddress,
        title: room.displayName,
        height: 48,
      })),
    [rooms],
  );

  const items = useMemo(() => {
    const allItems: {
      id: string;
      group: string;
      title: string;
      start_time: moment.Moment;
      end_time: moment.Moment;
      canMove: boolean;
      canResize: boolean;
      canChangeGroup: boolean;
      itemProps: { style: React.CSSProperties };
      _event: RoomEvent;
    }[] = [];
    let idx = 0;
    events.forEach((roomEvents, roomEmail) => {
      for (const event of roomEvents) {
        const color = getEventColor(event);
        const isLight = event.isAllDay || color === "#f59e0b";
        allItems.push({
          id: `${roomEmail}-${idx++}`,
          group: roomEmail,
          title: `${event.subject} — ${event.organizer.name}`,
          start_time: moment(event.start.dateTime),
          end_time: moment(event.end.dateTime),
          canMove: false,
          canResize: false,
          canChangeGroup: false,
          itemProps: {
            style: {
              background: `linear-gradient(135deg, ${color}, ${color}dd)`,
              border: "none",
              borderRadius: "6px",
              color: isLight ? "#000" : "#fff",
              fontSize: "11px",
              padding: "2px 8px",
              cursor: "pointer",
            },
          },
          _event: event,
        });
      }
    });
    return allItems;
  }, [events]);

  const defaultTimeStart = moment().startOf("day").add(7, "hours");
  const defaultTimeEnd = moment().startOf("day").add(19, "hours");

  const handleItemSelect = useCallback(
    (itemId: string | number) => {
      const item = items.find((i) => i.id === itemId);
      if (item?._event) {
        onEventClick(item._event);
      }
    },
    [items, onEventClick],
  );

  const handleCanvasClick = useCallback(
    (groupId: string | number, time: number) => {
      onEmptySlotClick(String(groupId), new Date(time));
    },
    [onEmptySlotClick],
  );

  if (rooms.length === 0) {
    return (
      <div className="flex h-full items-center justify-center text-gray-500">
        No rooms loaded
      </div>
    );
  }

  return (
    <div className="h-full [&_.rct-header-root]:bg-[#0f0f18] [&_.rct-sidebar]:bg-[#0f0f18] [&_.rct-calendar-header]:bg-[#0f0f18] [&_.rct-outer]:bg-[#0a0a0f]">
      <Timeline
        groups={groups}
        items={items}
        defaultTimeStart={defaultTimeStart}
        defaultTimeEnd={defaultTimeEnd}
        sidebarWidth={140}
        lineHeight={48}
        itemHeightRatio={0.75}
        stackItems={true}
        canMove={false}
        canResize={false}
        canChangeGroup={false}
        onItemSelect={handleItemSelect}
        onCanvasClick={handleCanvasClick}
      >
        <TimelineMarkers>
          {/* date prop is required by @types but TodayMarker auto-uses current time */}
          <TodayMarker date={new Date()} interval={30000}>
            {({ styles }: CustomMarkerChildrenProps) => (
              <div
                style={{
                  ...styles,
                  backgroundColor: "#f59e0b",
                  width: "2px",
                  zIndex: 10,
                }}
              />
            )}
          </TodayMarker>
        </TimelineMarkers>
      </Timeline>
    </div>
  );
}
