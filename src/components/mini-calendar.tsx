"use client";

import { useState } from "react";

interface MiniCalendarProps {
  readonly selectedDate: Date;
  readonly onDateSelect: (date: Date) => void;
}

const DAY_LABELS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const MONTH_NAMES = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];

function sameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();
}

export function MiniCalendar({ selectedDate, onDateSelect }: MiniCalendarProps) {
  const [viewYear, setViewYear] = useState(selectedDate.getFullYear());
  const [viewMonth, setViewMonth] = useState(selectedDate.getMonth());
  const today = new Date();

  const firstDay = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

  function prevMonth() {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  }
  function nextMonth() {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  }

  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  // pad to complete last row
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <div className="select-none">
      <div className="mb-2 flex items-center justify-between">
        <button onClick={prevMonth} className="rounded p-0.5 text-gray-400 hover:text-white">
          ‹
        </button>
        <span className="text-[11px] font-semibold text-gray-300">
          {MONTH_NAMES[viewMonth]} {viewYear}
        </span>
        <button onClick={nextMonth} className="rounded p-0.5 text-gray-400 hover:text-white">
          ›
        </button>
      </div>
      <div className="grid grid-cols-7 gap-0.5">
        {DAY_LABELS.map((d) => (
          <div key={d} className="text-center text-[9px] font-bold text-gray-600">{d}</div>
        ))}
        {cells.map((day, i) => {
          if (!day) return <div key={i} />;
          const date = new Date(viewYear, viewMonth, day);
          const isToday = sameDay(date, today);
          const isSelected = sameDay(date, selectedDate);
          return (
            <button
              key={i}
              onClick={() => onDateSelect(date)}
              className={`rounded py-0.5 text-center text-[11px] transition ${
                isSelected
                  ? "bg-indigo-600 font-bold text-white"
                  : isToday
                  ? "font-bold text-indigo-400 hover:bg-[#1a1a2e]"
                  : "text-gray-400 hover:bg-[#1a1a2e] hover:text-white"
              }`}
            >
              {day}
            </button>
          );
        })}
      </div>
    </div>
  );
}
