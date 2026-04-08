"use client";

import { useMemo } from "react";
import type { Room } from "@/types/room";
import type { RoomEvent } from "@/types/event";

interface DailyViewProps {
  readonly rooms: readonly Room[];
  readonly events: Map<string, RoomEvent[]>;
  readonly onEventClick: (event: RoomEvent) => void;
  readonly onEmptySlotClick: (roomEmail: string, time: Date) => void;
}

const HOURS = Array.from({ length: 12 }, (_, i) => i + 7);

function getEventColor(event: RoomEvent): string {
  const now = new Date();
  const start = new Date(event.start.dateTime);
  const end = new Date(event.end.dateTime);
  if (event.isAllDay) return "bg-emerald-600";
  if (start <= now && end >= now) return "bg-amber-500";
  if (event.isRecurring) return "bg-purple-500";
  return "bg-indigo-600";
}

export function DailyView({
  rooms,
  events,
  onEventClick,
  onEmptySlotClick,
}: DailyViewProps) {
  const today = new Date();

  const roomEvents = useMemo(() => {
    return rooms.map((room) => ({
      room,
      events: events.get(room.emailAddress) ?? [],
    }));
  }, [rooms, events]);

  return (
    <div className="h-full overflow-auto">
      <table className="w-full border-collapse">
        <thead className="sticky top-0 z-10 bg-[#0f0f18]">
          <tr>
            <th className="w-36 border-b border-[#2a2a3a] px-3 py-2 text-left text-xs text-gray-500">
              Room
            </th>
            {HOURS.map((h) => (
              <th
                key={h}
                className="min-w-[80px] border-b border-[#2a2a3a] px-1 py-2 text-center text-[10px] text-gray-500"
              >
                {h > 12 ? `${h - 12} PM` : h === 12 ? "12 PM" : `${h} AM`}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {roomEvents.map(({ room, events: roomEvts }, idx) => (
            <tr
              key={room.id}
              className={idx % 2 === 0 ? "bg-[#0a0a0f]" : "bg-[#0c0c14]"}
            >
              <td className="border-b border-[#1a1a2e] px-3 py-2 text-xs font-medium text-gray-300">
                {room.displayName}
              </td>
              {HOURS.map((h) => {
                const cellStart = new Date(today);
                cellStart.setHours(h, 0, 0, 0);
                const cellEnd = new Date(today);
                cellEnd.setHours(h + 1, 0, 0, 0);

                const cellEvents = roomEvts.filter((e) => {
                  const eStart = new Date(e.start.dateTime);
                  const eEnd = new Date(e.end.dateTime);
                  return eStart < cellEnd && eEnd > cellStart;
                });

                if (cellEvents.length > 0) {
                  const evt = cellEvents[0];
                  return (
                    <td
                      key={h}
                      onClick={() => onEventClick(evt)}
                      className={`cursor-pointer border-b border-[#1a1a2e] px-1 py-1 ${getEventColor(evt)} rounded text-[10px] text-white`}
                    >
                      <div className="truncate">{evt.subject}</div>
                    </td>
                  );
                }

                return (
                  <td
                    key={h}
                    onClick={() => onEmptySlotClick(room.emailAddress, cellStart)}
                    className="cursor-pointer border-b border-[#1a1a2e] px-1 py-1 text-center text-[10px] text-gray-700 hover:bg-[#1a1a2e]"
                  >
                    &nbsp;
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
