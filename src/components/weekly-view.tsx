"use client";

import { useMemo, Fragment } from "react";
import type { Room } from "@/types/room";
import type { RoomEvent } from "@/types/event";

interface WeeklyViewProps {
  readonly rooms: readonly Room[];
  readonly events: Map<string, RoomEvent[]>;
  readonly weekStart: Date;
  readonly onEventClick: (event: RoomEvent) => void;
  readonly onEmptySlotClick: (roomEmail: string, time: Date) => void;
}

const DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri"];

function getWeekDates(weekStart: Date): Date[] {
  // Find Monday of the week containing weekStart
  const d = new Date(weekStart);
  d.setHours(0, 0, 0, 0);
  const day = d.getDay(); // 0=Sun, 1=Mon...
  const offset = day === 0 ? -6 : 1 - day; // shift to Monday
  d.setDate(d.getDate() + offset);
  return DAY_NAMES.map((_, i) => {
    const date = new Date(d);
    date.setDate(d.getDate() + i);
    return date;
  });
}

function fmtTime(dateStr: string): string {
  const d = new Date(dateStr);
  const h = d.getHours();
  const m = d.getMinutes();
  const suffix = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 || 12;
  return m === 0 ? `${h12}${suffix}` : `${h12}:${m.toString().padStart(2, "0")}${suffix}`;
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

function sameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function WeeklyView({ rooms, events, weekStart, onEventClick, onEmptySlotClick }: WeeklyViewProps) {
  const weekDates = useMemo(() => getWeekDates(weekStart), [weekStart]);
  const today = useMemo(() => new Date(), []);

  return (
    <div className="h-full overflow-auto p-4">
      <table className="w-full border-collapse">
        <thead className="sticky top-0 z-10 bg-[#0f0f18]">
          <tr>
            <th className="w-36 border-b border-[#2a2a3a] px-3 py-2 text-left text-xs text-gray-500">
              Room
            </th>
            {weekDates.map((d, i) => {
              const isToday = sameDay(d, today);
              return (
                <th
                  key={i}
                  className={`min-w-[120px] border-b border-[#2a2a3a] px-2 py-2 text-center text-[11px] font-semibold ${
                    isToday ? "text-indigo-400" : "text-gray-400"
                  }`}
                >
                  {DAY_NAMES[i]}{" "}
                  <span className={isToday ? "text-indigo-300" : "text-gray-500"}>
                    {d.getMonth() + 1}/{d.getDate()}
                  </span>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {rooms.map((room, idx) => {
            const roomEvts = events.get(room.emailAddress) ?? [];
            return (
              <tr
                key={room.id}
                className={idx % 2 === 0 ? "bg-[#0a0a0f]" : "bg-[#0c0c14]"}
              >
                <td className="border-b border-[#1a1a2e] px-3 py-2 align-top text-xs font-medium text-gray-300">
                  <div className="truncate">{room.displayName}</div>
                  {room.capacity > 0 && (
                    <div className="text-[10px] text-gray-600">Cap: {room.capacity}</div>
                  )}
                </td>
                {weekDates.map((date, di) => {
                  const dayStart = new Date(date);
                  dayStart.setHours(0, 0, 0, 0);
                  const dayEnd = new Date(date);
                  dayEnd.setHours(23, 59, 59, 999);

                  const dayEvents = roomEvts.filter((e) => {
                    const eStart = new Date(e.start.dateTime);
                    const eEnd = new Date(e.end.dateTime);
                    return eStart < dayEnd && eEnd > dayStart;
                  });

                  if (dayEvents.length > 0) {
                    return (
                      <td
                        key={di}
                        className="border-b border-[#1a1a2e] px-0.5 py-0.5 align-top"
                      >
                        {dayEvents.map((evt) => (
                          <div
                            key={evt.id}
                            onClick={() => onEventClick(evt)}
                            className={`mb-0.5 cursor-pointer rounded border-l-2 px-1.5 py-1 text-[10px] ${getEventColor(evt)} hover:opacity-90`}
                          >
                            <div className="truncate font-semibold text-white">{evt.subject}</div>
                            <div className="text-gray-300">
                              {fmtTime(evt.start.dateTime)}–{fmtTime(evt.end.dateTime)}
                            </div>
                          </div>
                        ))}
                      </td>
                    );
                  }

                  return (
                    <td
                      key={di}
                      onClick={() => onEmptySlotClick(room.emailAddress, new Date(date.setHours(9, 0, 0, 0)))}
                      className="cursor-pointer border-b border-[#1a1a2e] px-1 py-2 text-center text-[10px] text-gray-800 hover:bg-[#1a1a2e]"
                    >
                      &nbsp;
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
