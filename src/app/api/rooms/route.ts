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

function getSiteLabel(emailAddress: string): string {
  const local = emailAddress.split("@")[0].toLowerCase();
  if (local.startsWith("can2200")) return "BG2200";
  if (local.startsWith("can2205")) return "BG2205";
  return "Other";
}

function groupBySite(rooms: Room[]): GroupedRooms {
  const siteOrder = ["BG2200", "BG2205", "Other"];
  const bySite = new Map<string, Room[]>();
  for (const site of siteOrder) bySite.set(site, []);
  for (const room of rooms) {
    const key = getSiteLabel(room.emailAddress);
    bySite.get(key)!.push(room);
  }
  const groups: RoomGroup[] = siteOrder
    .filter((site) => (bySite.get(site)?.length ?? 0) > 0)
    .map((site) => ({ label: site, rooms: bySite.get(site)! }));
  return { groups, totalCount: rooms.length };
}

export async function GET() {
  try {
    const rooms = await fetchRooms();
    const grouped = groupBySite(rooms);
    return NextResponse.json(grouped);
  } catch (error) {
    console.error("Failed to fetch rooms:", error);
    return NextResponse.json({ error: "Failed to fetch rooms" }, { status: 500 });
  }
}
