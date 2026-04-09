"use client";

import { ReactNode, useState } from "react";
import { TopBar } from "./top-bar";
import type { DateRange } from "./date-range-picker";
import type { ViewMode } from "./view-toggle";

interface AppShellProps {
  readonly sidebar: ReactNode;
  readonly children: (viewMode: ViewMode, dateRange: DateRange) => ReactNode;
  readonly panel: ReactNode | null;
  readonly dateRange: DateRange;
  readonly onDateRangeChange: (range: DateRange) => void;
}

export function AppShell({ sidebar, children, panel, dateRange, onDateRangeChange }: AppShellProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("timeline");

  return (
    <div className="flex h-screen flex-col bg-[#0a0a0f]">
      <TopBar
        activeView={viewMode}
        onViewChange={setViewMode}
        dateRange={dateRange}
        onDateRangeChange={onDateRangeChange}
      />
      <div className="flex flex-1 overflow-hidden">
        <aside className="w-52 flex-shrink-0 overflow-y-auto border-r border-[#2a2a3a] bg-[#0f0f18] p-3">
          {sidebar}
        </aside>
        <main className="flex-1 overflow-auto">{children(viewMode, dateRange)}</main>
        {panel && (
          <div className="w-96 flex-shrink-0 border-l border-[#2a2a3a] bg-[#12121a] shadow-2xl">
            {panel}
          </div>
        )}
      </div>
    </div>
  );
}
