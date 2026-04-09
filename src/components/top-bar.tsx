"use client";

import { ViewToggle, type ViewMode } from "./view-toggle";
import { DateRangePicker, type DateRange } from "./date-range-picker";
import { useAuth } from "@/hooks/use-auth";

interface TopBarProps {
  readonly activeView: ViewMode;
  readonly onViewChange: (view: ViewMode) => void;
  readonly dateRange: DateRange;
  readonly onDateRangeChange: (range: DateRange) => void;
}

export function TopBar({ activeView, onViewChange, dateRange, onDateRangeChange }: TopBarProps) {
  const { userName, logout } = useAuth();

  const initials = userName
    ? userName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "?";

  return (
    <header className="flex items-center justify-between border-b border-[#2a2a3a] bg-[#12121a] px-5 py-3">
      <div className="text-lg font-bold text-white">Caire Room Manager</div>
      <div className="flex items-center gap-4">
        <DateRangePicker value={dateRange} onChange={onDateRangeChange} />
        <ViewToggle activeView={activeView} onViewChange={onViewChange} />
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-600 text-xs font-semibold text-white">
            {initials}
          </div>
          <span className="text-sm text-gray-300">{userName}</span>
          <button
            onClick={logout}
            className="ml-2 text-xs text-gray-500 hover:text-gray-300"
          >
            Sign out
          </button>
        </div>
      </div>
    </header>
  );
}
