"use client";

import { useState, useEffect } from "react";
import type { GroupedRooms } from "@/types/room";

export function useRooms() {
  const [data, setData] = useState<GroupedRooms | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchRooms() {
      try {
        setIsLoading(true);
        const response = await fetch("/api/rooms");
        if (!response.ok) {
          throw new Error(`Failed to fetch rooms: ${response.status}`);
        }
        const grouped: GroupedRooms = await response.json();
        setData(grouped);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setIsLoading(false);
      }
    }
    fetchRooms();
  }, []);

  return { data, isLoading, error };
}
