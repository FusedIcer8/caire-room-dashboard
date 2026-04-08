import type { Room, GroupedRooms, RoomGroup } from "@/types/room";

type RoomFetcher = () => Promise<Room[]>;

export class RoomCache {
  private rooms: Room[] | null = null;
  private fetchedAt: number = 0;
  private readonly fetcher: RoomFetcher;
  private readonly ttlMs: number;

  constructor(fetcher: RoomFetcher, ttlMs: number = 3600000) {
    this.fetcher = fetcher;
    this.ttlMs = ttlMs;
  }

  async getRooms(): Promise<Room[]> {
    const now = Date.now();
    if (this.rooms && now - this.fetchedAt < this.ttlMs) {
      return this.rooms;
    }
    this.rooms = await this.fetcher();
    this.fetchedAt = now;
    return this.rooms;
  }

  async getGroupedRooms(): Promise<GroupedRooms> {
    const rooms = await this.getRooms();
    const byBuilding = new Map<string, Room[]>();

    for (const room of rooms) {
      const key = room.building || "Unknown";
      const existing = byBuilding.get(key) ?? [];
      byBuilding.set(key, [...existing, room]);
    }

    const groups: RoomGroup[] = Array.from(byBuilding.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([label, rooms]) => ({ label, rooms }));

    return { groups, totalCount: rooms.length };
  }

  invalidate(): void {
    this.rooms = null;
    this.fetchedAt = 0;
  }
}
