import { describe, it, expect, vi, beforeEach } from "vitest";
import { RoomCache } from "@/lib/room-cache";
import type { Room } from "@/types/room";

const mockRooms: Room[] = [
  {
    id: "room-1",
    displayName: "Boardroom A",
    emailAddress: "boardroom-a@caireinc.com",
    building: "HQ",
    floorNumber: 1,
    capacity: 20,
  },
  {
    id: "room-2",
    displayName: "Huddle 1",
    emailAddress: "huddle-1@caireinc.com",
    building: "HQ",
    floorNumber: 1,
    capacity: 4,
  },
  {
    id: "room-3",
    displayName: "Meeting Rm 1",
    emailAddress: "meeting-1@caireinc.com",
    building: "Branch",
    floorNumber: 1,
    capacity: 6,
  },
];

describe("RoomCache", () => {
  let cache: RoomCache;
  let fetchRooms: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchRooms = vi.fn().mockResolvedValue(mockRooms);
    cache = new RoomCache(fetchRooms, 3600000);
  });

  it("fetches rooms on first call", async () => {
    const result = await cache.getRooms();
    expect(fetchRooms).toHaveBeenCalledOnce();
    expect(result).toHaveLength(3);
  });

  it("returns cached rooms on subsequent calls", async () => {
    await cache.getRooms();
    await cache.getRooms();
    expect(fetchRooms).toHaveBeenCalledOnce();
  });

  it("refetches after TTL expires", async () => {
    vi.useFakeTimers();
    await cache.getRooms();
    vi.advanceTimersByTime(3600001);
    await cache.getRooms();
    expect(fetchRooms).toHaveBeenCalledTimes(2);
    vi.useRealTimers();
  });

  it("groups rooms by building", async () => {
    const grouped = await cache.getGroupedRooms();
    expect(grouped.groups).toHaveLength(2);
    expect(grouped.groups[0].label).toBe("Branch");
    expect(grouped.groups[1].label).toBe("HQ");
    expect(grouped.groups[1].rooms).toHaveLength(2);
    expect(grouped.totalCount).toBe(3);
  });

  it("invalidate forces refetch", async () => {
    await cache.getRooms();
    cache.invalidate();
    await cache.getRooms();
    expect(fetchRooms).toHaveBeenCalledTimes(2);
  });
});
