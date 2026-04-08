"use client";

import type { GroupedRooms } from "@/types/room";

interface RoomSidebarProps {
  readonly data: GroupedRooms | null;
  readonly searchQuery: string;
  readonly onSearchChange: (query: string) => void;
  readonly minCapacity: number;
  readonly onMinCapacityChange: (value: number) => void;
}

export function RoomSidebar({
  data,
  searchQuery,
  onSearchChange,
  minCapacity,
  onMinCapacityChange,
}: RoomSidebarProps) {
  if (!data) {
    return <div className="p-3 text-sm text-gray-500">Loading rooms...</div>;
  }

  const filtered = data.groups
    .map((group) => ({
      ...group,
      rooms: group.rooms.filter(
        (room) =>
          room.displayName.toLowerCase().includes(searchQuery.toLowerCase()) &&
          room.capacity >= minCapacity,
      ),
    }))
    .filter((group) => group.rooms.length > 0);

  return (
    <div>
      <input
        type="text"
        placeholder="Search rooms..."
        value={searchQuery}
        onChange={(e) => onSearchChange(e.target.value)}
        className="mb-3 w-full rounded-md border border-[#2a2a3a] bg-[#1a1a2e] px-2.5 py-2 text-xs text-gray-300 placeholder-gray-500 outline-none focus:border-indigo-500"
      />

      <div className="mb-3 border-t border-[#2a2a3a] pt-3">
        <div className="mb-1 text-[10px] font-semibold uppercase text-gray-500">
          Min. Capacity: {minCapacity}
        </div>
        <input
          type="range"
          min={1}
          max={30}
          value={minCapacity}
          onChange={(e) => onMinCapacityChange(Number(e.target.value))}
          className="w-full accent-indigo-500"
        />
        <div className="flex justify-between text-[10px] text-gray-600">
          <span>1</span>
          <span>30+</span>
        </div>
      </div>

      {filtered.map((group) => (
        <div key={group.label} className="mb-3">
          <div className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-indigo-400">
            {group.label}
          </div>
          {group.rooms.map((room) => (
            <div
              key={room.id}
              className="mb-1 rounded px-2 py-1.5 text-xs text-gray-300 hover:bg-[#1a1a2e]"
            >
              {room.displayName}{" "}
              <span className="text-[10px] text-gray-600">({room.capacity})</span>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
