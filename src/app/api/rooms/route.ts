import { NextResponse } from "next/server";
import { getGraphClient } from "@/lib/graph-client";
import type { Room, GroupedRooms, RoomGroup } from "@/types/room";

function mapGraphRoomToRoom(graphRoom: Record<string, unknown>): Room {
  return {
    id: graphRoom.id as string,
    displayName: graphRoom.displayName as string,
    emailAddress: graphRoom.emailAddress as string,
    building: (graphRoom.building as string | undefined) ?? "Unknown",
    floorNumber: (graphRoom.floorNumber as number | undefined) ?? 0,
    capacity: (graphRoom.capacity as number | undefined) ?? 0,
  };
}

let cachedRooms: Room[] | null = null;
let cachedAt = 0;
const CACHE_TTL = 3600000;

async function fetchRooms(): Promise<Room[]> {
  const now = Date.now();
  if (cachedRooms && now - cachedAt < CACHE_TTL) {
    return cachedRooms;
  }
  const client = await getGraphClient();
  const response = await client
    .api("/places/microsoft.graph.room")
    .select(["id", "displayName", "emailAddress", "capacity", "building", "floorNumber"])
    .get();
  cachedRooms = ((response.value ?? []) as Record<string, unknown>[]).map(mapGraphRoomToRoom);
  cachedAt = now;
  return cachedRooms;
}

function groupByBuilding(rooms: Room[]): GroupedRooms {
  const byBuilding = new Map<string, Room[]>();
  for (const room of rooms) {
    const key = room.building;
    const existing = byBuilding.get(key) ?? [];
    byBuilding.set(key, [...existing, room]);
  }
  const groups: RoomGroup[] = Array.from(byBuilding.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([label, roomList]) => ({ label, rooms: roomList }));
  return { groups, totalCount: rooms.length };
}

export async function GET() {
  try {
    const rooms = await fetchRooms();
    const grouped = groupByBuilding(rooms);
    return NextResponse.json(grouped);
  } catch (error) {
    console.error("Failed to fetch rooms:", error);
    return NextResponse.json({ error: "Failed to fetch rooms" }, { status: 500 });
  }
}
