"use client";

export type ViewMode = "timeline" | "daily" | "weekly";

interface ViewToggleProps {
  readonly activeView: ViewMode;
  readonly onViewChange: (view: ViewMode) => void;
}

const views: { key: ViewMode; label: string }[] = [
  { key: "timeline", label: "Timeline" },
  { key: "daily", label: "Daily" },
  { key: "weekly", label: "Weekly" },
];

export function ViewToggle({ activeView, onViewChange }: ViewToggleProps) {
  return (
    <div className="flex gap-0.5 rounded-md bg-[#1a1a2e] p-0.5">
      {views.map((v) => (
        <button
          key={v.key}
          onClick={() => onViewChange(v.key)}
          className={`rounded px-3.5 py-1.5 text-xs font-semibold transition ${
            activeView === v.key
              ? "bg-indigo-600 text-white"
              : "text-gray-500 hover:text-gray-300"
          }`}
        >
          {v.label}
        </button>
      ))}
    </div>
  );
}
