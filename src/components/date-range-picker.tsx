"use client";

import { useState } from "react";

export interface DateRange {
  start: Date;
  end: Date;
  label: string;
}

interface DateRangePickerProps {
  readonly value: DateRange;
  readonly onChange: (range: DateRange) => void;
}

function startOfDay(d: Date): Date {
  const r = new Date(d);
  r.setHours(0, 0, 0, 0);
  return r;
}

function endOfDay(d: Date): Date {
  const r = new Date(d);
  r.setHours(23, 59, 59, 999);
  return r;
}

export function getPresetRanges(): Record<string, () => DateRange> {
  return {
    Today: () => {
      const d = new Date();
      return { start: startOfDay(d), end: endOfDay(d), label: "Today" };
    },
    "This Week": () => {
      const d = new Date();
      const start = new Date(d);
      start.setDate(d.getDate() - d.getDay());
      const end = new Date(start);
      end.setDate(start.getDate() + 6);
      return { start: startOfDay(start), end: endOfDay(end), label: "This Week" };
    },
    "This Month": () => {
      const d = new Date();
      const start = new Date(d.getFullYear(), d.getMonth(), 1);
      const end = new Date(d.getFullYear(), d.getMonth() + 1, 0);
      return { start: startOfDay(start), end: endOfDay(end), label: "This Month" };
    },
    "Next Month": () => {
      const d = new Date();
      const start = new Date(d.getFullYear(), d.getMonth() + 1, 1);
      const end = new Date(d.getFullYear(), d.getMonth() + 2, 0);
      return { start: startOfDay(start), end: endOfDay(end), label: "Next Month" };
    },
  };
}

export function DateRangePicker({ value, onChange }: DateRangePickerProps) {
  const [showCustom, setShowCustom] = useState(false);
  const [customStart, setCustomStart] = useState(
    value.start.toISOString().slice(0, 10),
  );
  const [customEnd, setCustomEnd] = useState(
    value.end.toISOString().slice(0, 10),
  );

  const presets = getPresetRanges();

  const applyCustom = () => {
    if (!customStart || !customEnd) return;
    const start = startOfDay(new Date(customStart + "T00:00:00"));
    const end = endOfDay(new Date(customEnd + "T00:00:00"));
    if (start > end) return;
    const label = `${customStart} – ${customEnd}`;
    onChange({ start, end, label });
    setShowCustom(false);
  };

  return (
    <div className="flex items-center gap-1">
      {Object.entries(presets).map(([name, fn]) => (
        <button
          key={name}
          onClick={() => { setShowCustom(false); onChange(fn()); }}
          className={`rounded px-2.5 py-1 text-xs font-medium transition ${
            value.label === name
              ? "bg-indigo-600 text-white"
              : "text-gray-400 hover:bg-[#1a1a2e] hover:text-gray-200"
          }`}
        >
          {name}
        </button>
      ))}
      <button
        onClick={() => setShowCustom((s) => !s)}
        className={`rounded px-2.5 py-1 text-xs font-medium transition ${
          showCustom || !Object.keys(presets).includes(value.label)
            ? "bg-indigo-600 text-white"
            : "text-gray-400 hover:bg-[#1a1a2e] hover:text-gray-200"
        }`}
      >
        Custom
      </button>
      {showCustom && (
        <div className="flex items-center gap-1.5 rounded-md border border-[#2a2a3a] bg-[#12121a] px-2 py-1">
          <input
            type="date"
            value={customStart}
            onChange={(e) => setCustomStart(e.target.value)}
            className="rounded bg-[#1a1a2e] px-1.5 py-0.5 text-xs text-gray-300 outline-none focus:ring-1 focus:ring-indigo-500"
          />
          <span className="text-xs text-gray-500">to</span>
          <input
            type="date"
            value={customEnd}
            onChange={(e) => setCustomEnd(e.target.value)}
            className="rounded bg-[#1a1a2e] px-1.5 py-0.5 text-xs text-gray-300 outline-none focus:ring-1 focus:ring-indigo-500"
          />
          <button
            onClick={applyCustom}
            className="rounded bg-indigo-600 px-2 py-0.5 text-xs font-semibold text-white hover:bg-indigo-500"
          >
            Apply
          </button>
        </div>
      )}
    </div>
  );
}
