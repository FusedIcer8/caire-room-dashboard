"use client";

import { useMemo } from "react";
import type { Room } from "@/types/room";
import type { RoomEvent } from "@/types/event";

interface DailyViewProps {
  readonly rooms: readonly Room[];
  readonly events: Map<string, RoomEvent[]>;
  readonly date: Date;
  readonly onEventClick: (event: RoomEvent) => void;
  readonly onEmptySlotClick: (roomEmail: string, time: Date) => void;
}

const HOURS = Array.from({ length: 13 }, (_, i) => i + 7); // 7am–7pm

function fmt12(h: number): string {
  if (h === 12) return "12 PM";
  return h > 12 ? `${h - 12} PM` : `${h} AM`;
}

function fmtTime(dateStr: string): string {
  const d = new Date(dateStr);
  const h = d.getHours();
  const m = d.getMinutes();
  const suffix = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 || 12;
  return m === 0 ? `${h12} ${suffix}` : `${h12}:${m.toString().padStart(2, "0")} ${suffix}`;
}

function getEventColor(event: RoomEvent): string {
  const now = new Date();
  const start = new Date(event.start.dateTime);
  const end = new Date(event.end.dateTime);
  if (event.isAllDay) return "bg-emerald-700 border-emerald-500";
  if (start <= now && end >= now) return "bg-amber-700 border-amber-500";
  if (event.isRecurring) return "bg-purple-700 border-purple-500";
  return "bg-indigo-700 border-indigo-500";
}

export function DailyView({ rooms, events, date, onEventClick, onEmptySlotClick }: DailyViewProps) {
  const dayStart = useMemo(() => {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d;
  }, [date]);

  const roomEvents = useMemo(() => {
    return rooms.map((room) => ({
      room,
      events: (events.get(room.emailAddress) ?? []).filter((e) => {
        const eStart = new Date(e.start.dateTime);
        const eEnd = new Date(e.end.dateTime);
        const dEnd = new Date(dayStart);
        dEnd.setHours(23, 59, 59, 999);
        return eStart < dEnd && eEnd > dayStart;
      }),
    }));
  }, [rooms, events, dayStart]);

  const dateLabel = date.toLocaleDateString("en-US", {
    weekday: "long", month: "long", day: "numeric", year: "numeric",
  });

  return (
    <div className="h-full overflow-auto">
      <div className="sticky top-0 z-10 border-b border-[#2a2a3a] bg-[#0f0f18] px-4 py-2 text-sm font-semibold text-gray-300">
        {dateLabel}
      </div>
      <table className="w-full border-collapse">
        <thead className="sticky top-[37px] z-10 bg-[#0f0f18]">
          <tr>
            <th className="w-40 border-b border-[#2a2a3a] px-3 py-2 text-left text-xs text-gray-500">Room</th>
            {HOURS.map((h) => (
              <th key={h} className="min-w-[72px] border-b border-[#2a2a3a] px-1 py-2 text-center text-[10px] text-gray-500">
                {fmt12(h)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {roomEvents.map(({ room, events: roomEvts }, idx) => (
            <tr key={room.id} className={idx % 2 === 0 ? "bg-[#0a0a0f]" : "bg-[#0c0c14]"}>
              <td className="border-b border-[#1a1a2e] px-3 py-2 align-top text-xs font-medium text-gray-300">
                <div className="truncate">{room.displayName}</div>
                {room.capacity > 0 && (
                  <div className="text-[10px] text-gray-600">Cap: {room.capacity}</div>
                )}
              </td>
              {HOURS.map((h) => {
                const cellStart = new Date(dayStart);
                cellStart.setHours(h, 0, 0, 0);
                const cellEnd = new Date(dayStart);
                cellEnd.setHours(h + 1, 0, 0, 0);

                const cellEvents = roomEvts.filter((e) => {
                  const eStart = new Date(e.start.dateTime);
                  const eEnd = new Date(e.end.dateTime);
                  return eStart < cellEnd && eEnd > cellStart;
                });

                if (cellEvents.length > 0) {
                  return (
                    <td key={h} className="border-b border-[#1a1a2e] px-0.5 py-0.5 align-top">
                      {cellEvents.map((evt) => (
                        <div
                          key={evt.id}
                          onClick={() => onEventClick(evt)}
                          className={`mb-0.5 cursor-pointer rounded border-l-2 px-1.5 py-1 text-[10px] ${getEventColor(evt)} hover:opacity-90`}
                        >
                          <div className="truncate font-semibold text-white">{evt.subject}</div>
                          <div className="text-gray-300">
                            {fmtTime(evt.start.dateTime)}–{fmtTime(evt.end.dateTime)}
                          </div>
                          {evt.organizer.name && (
                            <div className="truncate text-gray-400">{evt.organizer.name}</div>
                          )}
                        </div>
                      ))}
                    </td>
                  );
                }

                return (
                  <td
                    key={h}
                    onClick={() => onEmptySlotClick(room.emailAddress, cellStart)}
                    className="cursor-pointer border-b border-[#1a1a2e] px-1 py-2 text-center text-[10px] text-gray-800 hover:bg-[#1a1a2e]"
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
