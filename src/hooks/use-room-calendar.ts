"use client";

import { useState, useEffect, useCallback } from "react";
import type { RoomEvent } from "@/types/event";

interface UseRoomCalendarParams {
  readonly roomEmails: readonly string[];
  readonly startDate: string;
  readonly endDate: string;
}

export function useRoomCalendar({
  roomEmails,
  startDate,
  endDate,
}: UseRoomCalendarParams) {
  const [events, setEvents] = useState<Map<string, RoomEvent[]>>(new Map());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (roomEmails.length === 0) return;
    try {
      setIsLoading(true);
      const results = await Promise.all(
        roomEmails.map(async (email) => {
          const response = await fetch(
            `/api/rooms/${encodeURIComponent(email)}/calendar?startDate=${startDate}&endDate=${endDate}`,
          );
          if (!response.ok) return { email, events: [] as RoomEvent[] };
          const data = await response.json();
          return { email, events: data.events as RoomEvent[] };
        }),
      );

      const newMap = new Map<string, RoomEvent[]>();
      for (const { email, events } of results) {
        newMap.set(email, events);
      }
      setEvents(newMap);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsLoading(false);
    }
  }, [roomEmails, startDate, endDate]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { events, isLoading, error, refresh };
}
