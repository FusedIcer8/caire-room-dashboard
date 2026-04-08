"use client";

import { ReactNode, useState } from "react";
import { TopBar } from "./top-bar";
import type { ViewMode } from "./view-toggle";

interface AppShellProps {
  readonly sidebar: ReactNode;
  readonly children: (viewMode: ViewMode) => ReactNode;
  readonly panel: ReactNode | null;
}

export function AppShell({ sidebar, children, panel }: AppShellProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("timeline");

  const today = new Date();
  const dateLabel = today.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div className="flex h-screen flex-col bg-[#0a0a0f]">
      <TopBar
        activeView={viewMode}
        onViewChange={setViewMode}
        dateLabel={dateLabel}
      />
      <div className="flex flex-1 overflow-hidden">
        <aside className="w-52 flex-shrink-0 overflow-y-auto border-r border-[#2a2a3a] bg-[#0f0f18] p-3">
          {sidebar}
        </aside>
        <main className="flex-1 overflow-auto">{children(viewMode)}</main>
        {panel && (
          <div className="w-96 flex-shrink-0 border-l border-[#2a2a3a] bg-[#12121a] shadow-2xl">
            {panel}
          </div>
        )}
      </div>
    </div>
  );
}
