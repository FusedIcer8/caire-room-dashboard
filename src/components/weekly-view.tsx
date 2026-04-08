"use client";

import { useMemo, useState, Fragment } from "react";
import type { Room } from "@/types/room";
import type { RoomEvent } from "@/types/event";

interface WeeklyViewProps {
  readonly rooms: readonly Room[];
  readonly events: Map<string, RoomEvent[]>;
  readonly onEventClick: (event: RoomEvent) => void;
  readonly onEmptySlotClick: (roomEmail: string, time: Date) => void;
}

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri"];

function getWeekDates(): Date[] {
  const today = new Date();
  const day = today.getDay();
  const monday = new Date(today);
  monday.setDate(today.getDate() - ((day + 6) % 7));
  return DAYS.map((_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
}

type OccupancyLevel = "free" | "partial" | "busy";

function getOccupancy(
  events: RoomEvent[],
  date: Date,
  isAm: boolean,
): OccupancyLevel {
  const start = new Date(date);
  start.setHours(isAm ? 7 : 12, 0, 0, 0);
  const end = new Date(date);
  end.setHours(isAm ? 12 : 18, 0, 0, 0);

  const overlapping = events.filter((e) => {
    const eStart = new Date(e.start.dateTime);
    const eEnd = new Date(e.end.dateTime);
    return eStart < end && eEnd > start;
  });

  if (overlapping.length === 0) return "free";
  const totalMinutes = overlapping.reduce((sum, e) => {
    const eStart = Math.max(
      new Date(e.start.dateTime).getTime(),
      start.getTime(),
    );
    const eEnd = Math.min(new Date(e.end.dateTime).getTime(), end.getTime());
    return sum + (eEnd - eStart) / 60000;
  }, 0);
  const blockMinutes = 5 * 60;
  return totalMinutes / blockMinutes > 0.6 ? "busy" : "partial";
}

const occupancyStyles = {
  free: "bg-emerald-900/30 text-emerald-400",
  partial: "bg-amber-900/30 text-amber-400",
  busy: "bg-red-900/30 text-red-400",
} as const;

export function WeeklyView({ rooms, events }: WeeklyViewProps) {
  const [expandedRoom, setExpandedRoom] = useState<string | null>(null);
  const weekDates = useMemo(getWeekDates, []);

  return (
    <div className="h-full overflow-auto p-4">
      <table className="w-full border-collapse">
        <thead className="sticky top-0 z-10 bg-[#0f0f18]">
          <tr>
            <th className="w-36 border-b border-[#2a2a3a] px-3 py-2 text-left text-xs text-gray-500">
              Room
            </th>
            {weekDates.map((d, i) => (
              <th
                key={i}
                colSpan={2}
                className="border-b border-[#2a2a3a] px-1 py-2 text-center text-[10px] text-gray-500"
              >
                {DAYS[i]} {d.getDate()}
              </th>
            ))}
          </tr>
          <tr>
            <th className="border-b border-[#2a2a3a]" />
            {weekDates.map((_, i) => (
              <Fragment key={i}>
                <th className="border-b border-[#2a2a3a] px-1 py-1 text-[9px] text-gray-600">
                  AM
                </th>
                <th className="border-b border-[#2a2a3a] px-1 py-1 text-[9px] text-gray-600">
                  PM
                </th>
              </Fragment>
            ))}
          </tr>
        </thead>
        <tbody>
          {rooms.map((room, idx) => {
            const roomEvts = events.get(room.emailAddress) ?? [];
            return (
              <tr
                key={room.id}
                className={`cursor-pointer ${idx % 2 === 0 ? "bg-[#0a0a0f]" : "bg-[#0c0c14]"} hover:bg-[#1a1a2e]`}
                onClick={() =>
                  setExpandedRoom(
                    expandedRoom === room.emailAddress
                      ? null
                      : room.emailAddress,
                  )
                }
              >
                <td className="border-b border-[#1a1a2e] px-3 py-2 text-xs font-medium text-gray-300">
                  {room.displayName}
                </td>
                {weekDates.map((date, di) => {
                  const amLevel = getOccupancy(roomEvts, date, true);
                  const pmLevel = getOccupancy(roomEvts, date, false);
                  return (
                    <Fragment key={di}>
                      <td
                        className={`border-b border-[#1a1a2e] px-2 py-2 text-center text-[10px] ${occupancyStyles[amLevel]}`}
                      >
                        {amLevel === "free"
                          ? "—"
                          : amLevel === "partial"
                            ? "~"
                            : "Full"}
                      </td>
                      <td
                        className={`border-b border-[#1a1a2e] px-2 py-2 text-center text-[10px] ${occupancyStyles[pmLevel]}`}
                      >
                        {pmLevel === "free"
                          ? "—"
                          : pmLevel === "partial"
                            ? "~"
                            : "Full"}
                      </td>
                    </Fragment>
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
