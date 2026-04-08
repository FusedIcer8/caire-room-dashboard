import { describe, it, expect } from "vitest";
import type { Room } from "@/types/room";

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

describe("mapGraphRoomToRoom", () => {
  it("maps a complete Graph room to our Room type", () => {
    const graphRoom = {
      id: "room-1",
      displayName: "Boardroom A",
      emailAddress: "boardroom-a@caireinc.com",
      building: "HQ",
      floorNumber: 1,
      capacity: 20,
    };
    const room = mapGraphRoomToRoom(graphRoom);
    expect(room).toEqual({
      id: "room-1",
      displayName: "Boardroom A",
      emailAddress: "boardroom-a@caireinc.com",
      building: "HQ",
      floorNumber: 1,
      capacity: 20,
    });
  });

  it("defaults missing building to Unknown", () => {
    const graphRoom = {
      id: "room-2",
      displayName: "Room X",
      emailAddress: "x@caireinc.com",
      floorNumber: 1,
      capacity: 4,
    };
    const room = mapGraphRoomToRoom(graphRoom);
    expect(room.building).toBe("Unknown");
  });

  it("defaults missing floorNumber to 0", () => {
    const graphRoom = {
      id: "room-3",
      displayName: "Room Y",
      emailAddress: "y@caireinc.com",
      building: "Annex",
      capacity: 8,
    };
    const room = mapGraphRoomToRoom(graphRoom);
    expect(room.floorNumber).toBe(0);
  });

  it("defaults missing capacity to 0", () => {
    const graphRoom = {
      id: "room-4",
      displayName: "Room Z",
      emailAddress: "z@caireinc.com",
      building: "Annex",
      floorNumber: 2,
    };
    const room = mapGraphRoomToRoom(graphRoom);
    expect(room.capacity).toBe(0);
  });
});
