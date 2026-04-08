"use client";

import { useState } from "react";
import type { Room } from "@/types/room";

interface QuickBookPanelProps {
  readonly room: Room;
  readonly initialDate: Date;
  readonly initialStartTime: Date;
  readonly onClose: () => void;
  readonly onBook: (data: {
    roomEmail: string;
    subject: string;
    startTime: string;
    endTime: string;
    onBehalfOf?: string;
    note?: string;
  }) => Promise<void>;
}

const durationOptions = [
  { label: "30m", minutes: 30 },
  { label: "1h", minutes: 60 },
  { label: "1.5h", minutes: 90 },
  { label: "2h", minutes: 120 },
];

function formatTimeInput(date: Date): string {
  return date.toTimeString().slice(0, 5);
}

function formatDateDisplay(date: Date): string {
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function combineDateAndTime(date: Date, timeStr: string): string {
  const [hours, minutes] = timeStr.split(":").map(Number);
  const result = new Date(date);
  result.setHours(hours, minutes, 0, 0);
  return result.toISOString();
}

export function QuickBookPanel({
  room,
  initialDate,
  initialStartTime,
  onClose,
  onBook,
}: QuickBookPanelProps) {
  const defaultEnd = new Date(initialStartTime.getTime() + 60 * 60 * 1000);

  const [subject, setSubject] = useState("");
  const [startTime, setStartTime] = useState(formatTimeInput(initialStartTime));
  const [endTime, setEndTime] = useState(formatTimeInput(defaultEnd));
  const [selectedDuration, setSelectedDuration] = useState(60);
  const [onBehalfOf, setOnBehalfOf] = useState("");
  const [note, setNote] = useState("");
  const [isBooking, setIsBooking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDurationClick = (minutes: number) => {
    setSelectedDuration(minutes);
    const [h, m] = startTime.split(":").map(Number);
    const start = new Date(initialDate);
    start.setHours(h, m, 0, 0);
    const end = new Date(start.getTime() + minutes * 60 * 1000);
    setEndTime(formatTimeInput(end));
  };

  const handleBook = async () => {
    if (!subject.trim()) {
      setError("Subject is required");
      return;
    }
    setError(null);
    setIsBooking(true);
    try {
      await onBook({
        roomEmail: room.emailAddress,
        subject: subject.trim(),
        startTime: combineDateAndTime(initialDate, startTime),
        endTime: combineDateAndTime(initialDate, endTime),
        onBehalfOf: onBehalfOf.trim() || undefined,
        note: note.trim() || undefined,
      });
      onClose();
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to book room";
      setError(message);
    } finally {
      setIsBooking(false);
    }
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-[#2a2a3a] px-5 py-4">
        <span className="text-sm font-bold text-emerald-400">Quick Book</span>
        <button
          onClick={onClose}
          className="flex h-7 w-7 items-center justify-center rounded-md bg-[#1a1a2e] text-gray-500 hover:text-gray-300"
        >
          ✕
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-5">
        <div className="mb-5">
          <label className="mb-2 block text-[10px] font-bold uppercase tracking-wider text-indigo-400">
            Room
          </label>
          <div className="rounded-lg border border-[#2a2a3a] bg-[#1a1a2e] p-3">
            <div className="text-sm font-semibold text-gray-200">
              {room.displayName}
            </div>
            <div className="text-xs text-gray-500">
              {room.building} · Capacity: {room.capacity}
            </div>
          </div>
        </div>

        <div className="mb-5">
          <label className="mb-2 block text-[10px] font-bold uppercase tracking-wider text-indigo-400">
            Date
          </label>
          <div className="rounded-lg border border-[#2a2a3a] bg-[#1a1a2e] p-3 text-sm text-gray-200">
            {formatDateDisplay(initialDate)}
          </div>
        </div>

        <div className="mb-5">
          <label className="mb-2 block text-[10px] font-bold uppercase tracking-wider text-indigo-400">
            Time
          </label>
          <div className="flex items-center gap-2">
            <input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="flex-1 rounded-lg border border-indigo-600 bg-[#1a1a2e] p-3 text-center text-sm text-white outline-none"
            />
            <span className="text-xs text-gray-600">→</span>
            <input
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="flex-1 rounded-lg border border-indigo-600 bg-[#1a1a2e] p-3 text-center text-sm text-white outline-none"
            />
          </div>
          <div className="mt-2 flex gap-1.5">
            {durationOptions.map((d) => (
              <button
                key={d.minutes}
                onClick={() => handleDurationClick(d.minutes)}
                className={`rounded px-2.5 py-1 text-xs ${
                  selectedDuration === d.minutes
                    ? "bg-indigo-600 font-semibold text-white"
                    : "border border-[#2a2a3a] bg-[#1a1a2e] text-gray-500"
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>

        <div className="mb-5">
          <label className="mb-2 block text-[10px] font-bold uppercase tracking-wider text-indigo-400">
            Subject <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="e.g., Client Call — Acme Corp"
            className="w-full rounded-lg border border-indigo-600 bg-[#1a1a2e] p-3 text-sm text-white placeholder-gray-500 outline-none"
          />
        </div>

        <div className="mb-5">
          <label className="mb-2 block text-[10px] font-bold uppercase tracking-wider text-indigo-400">
            Book on behalf of{" "}
            <span className="text-gray-600">(optional)</span>
          </label>
          <input
            type="email"
            value={onBehalfOf}
            onChange={(e) => setOnBehalfOf(e.target.value)}
            placeholder="Search by name or email..."
            className="w-full rounded-lg border border-[#2a2a3a] bg-[#1a1a2e] p-3 text-sm text-gray-300 placeholder-gray-500 outline-none"
          />
          <p className="mt-1 text-[11px] text-gray-600">
            Leave blank to book as yourself
          </p>
        </div>

        <div className="mb-5">
          <label className="mb-2 block text-[10px] font-bold uppercase tracking-wider text-indigo-400">
            Note <span className="text-gray-600">(optional)</span>
          </label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Any additional details..."
            className="min-h-[60px] w-full resize-y rounded-lg border border-[#2a2a3a] bg-[#1a1a2e] p-3 text-sm text-gray-300 placeholder-gray-500 outline-none"
          />
        </div>

        {error !== null && (
          <div className="mb-3 rounded-lg border border-red-600 bg-red-900/20 p-3 text-sm text-red-400">
            {error}
          </div>
        )}
      </div>

      <div className="border-t border-[#2a2a3a] bg-[#0f0f18] px-5 py-4">
        <button
          onClick={handleBook}
          disabled={isBooking}
          className="w-full rounded-lg bg-emerald-600 py-3.5 text-sm font-bold text-white hover:bg-emerald-500 disabled:opacity-50"
        >
          {isBooking ? "Booking..." : "Book Room"}
        </button>
        <p className="mt-2 text-center text-[10px] text-gray-600">
          Booking will appear on the room calendar immediately
        </p>
      </div>
    </div>
  );
}
