"use client";

import type { GroupedRooms } from "@/types/room";
import type { DateRange } from "@/components/date-range-picker";
import { MiniCalendar } from "@/components/mini-calendar";

interface RoomSidebarProps {
  readonly data: GroupedRooms | null;
  readonly selectedSite: string | null;
  readonly onSiteSelect: (site: string) => void;
  readonly searchQuery: string;
  readonly onSearchChange: (query: string) => void;
  readonly minCapacity: number;
  readonly onMinCapacityChange: (value: number) => void;
  readonly dateRange: DateRange;
  readonly onDateRangeChange: (range: DateRange) => void;
}

export function RoomSidebar({
  data,
  selectedSite,
  onSiteSelect,
  searchQuery,
  onSearchChange,
  minCapacity,
  onMinCapacityChange,
  dateRange,
  onDateRangeChange,
}: RoomSidebarProps) {
  if (!data) {
    return <div className="p-3 text-sm text-gray-500">Loading rooms...</div>;
  }

  const selectedGroup = data.groups.find((g) => g.label === selectedSite);

  const filteredRooms = (selectedGroup?.rooms ?? []).filter(
    (room) =>
      room.displayName.toLowerCase().includes(searchQuery.toLowerCase()) &&
      room.capacity >= minCapacity,
  );

  return (
    <div className="flex flex-col gap-3">
      {/* Site selector */}
      <div>
        <div className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-gray-500">
          Sites
        </div>
        {data.groups.map((group) => (
          <button
            key={group.label}
            onClick={() => onSiteSelect(group.label)}
            className={`mb-1 flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-xs font-semibold transition ${
              selectedSite === group.label
                ? "bg-indigo-600 text-white"
                : "bg-[#1a1a2e] text-gray-300 hover:bg-[#22223a] hover:text-white"
            }`}
          >
            <span>{group.label}</span>
            <span
              className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                selectedSite === group.label
                  ? "bg-indigo-500 text-white"
                  : "bg-[#2a2a3a] text-gray-400"
              }`}
            >
              {group.rooms.length}
            </span>
          </button>
        ))}
      </div>

      {/* Filters — only shown when a site is selected */}
      {selectedSite && (
        <>
          <div className="border-t border-[#2a2a3a] pt-3">
            <input
              type="text"
              placeholder="Search rooms..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full rounded-md border border-[#2a2a3a] bg-[#1a1a2e] px-2.5 py-2 text-xs text-gray-300 placeholder-gray-500 outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <div className="mb-1 text-[10px] font-semibold uppercase text-gray-500">
              Min. Capacity: {minCapacity}
            </div>
            <input
              type="range"
              min={0}
              max={30}
              value={minCapacity}
              onChange={(e) => onMinCapacityChange(Number(e.target.value))}
              className="w-full accent-indigo-500"
            />
            <div className="flex justify-between text-[10px] text-gray-600">
              <span>0</span>
              <span>30+</span>
            </div>
          </div>

          {/* Room list for selected site */}
          <div className="border-t border-[#2a2a3a] pt-3">
            <div className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-gray-500">
              Rooms ({filteredRooms.length})
            </div>
            {filteredRooms.length === 0 ? (
              <div className="text-[11px] text-gray-600">No rooms match filters</div>
            ) : (
              filteredRooms.map((room) => (
                <div
                  key={room.id}
                  className="mb-1 rounded px-2 py-1.5 text-xs text-gray-300"
                >
                  <div className="truncate font-medium">{room.displayName}</div>
                  <div className="text-[10px] text-gray-500">
                    Capacity: {room.capacity}
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}

      {/* Mini calendar — always visible */}
      <div className="border-t border-[#2a2a3a] pt-3">
        <div className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-gray-500">
          Date
        </div>
        <MiniCalendar
          selectedDate={dateRange.start}
          onDateSelect={(date) => {
            const start = new Date(date);
            start.setHours(0, 0, 0, 0);
            const end = new Date(date);
            end.setHours(23, 59, 59, 999);
            onDateRangeChange({ start, end, label: "Custom" });
          }}
        />
      </div>
    </div>
  );
}
