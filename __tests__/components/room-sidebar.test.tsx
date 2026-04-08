import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { RoomSidebar } from "@/components/room-sidebar";
import type { GroupedRooms } from "@/types/room";

const mockData: GroupedRooms = {
  groups: [
    {
      label: "HQ",
      rooms: [
        { id: "r1", displayName: "Boardroom A", emailAddress: "ba@c.com", building: "HQ", floorNumber: 1, capacity: 20 },
        { id: "r2", displayName: "Huddle 1", emailAddress: "h1@c.com", building: "HQ", floorNumber: 1, capacity: 4 },
      ],
    },
    {
      label: "Branch",
      rooms: [
        { id: "r3", displayName: "Meeting Rm 1", emailAddress: "m1@c.com", building: "Branch", floorNumber: 1, capacity: 6 },
      ],
    },
  ],
  totalCount: 3,
};

describe("RoomSidebar", () => {
  it("renders building group headers", () => {
    render(<RoomSidebar data={mockData} searchQuery="" onSearchChange={() => {}} minCapacity={1} onMinCapacityChange={() => {}} />);
    expect(screen.getByText("HQ")).toBeTruthy();
    expect(screen.getByText("Branch")).toBeTruthy();
  });

  it("renders room names with capacity", () => {
    render(<RoomSidebar data={mockData} searchQuery="" onSearchChange={() => {}} minCapacity={1} onMinCapacityChange={() => {}} />);
    expect(screen.getByText(/Boardroom A/)).toBeTruthy();
    expect(screen.getByText(/20/)).toBeTruthy();
  });

  it("renders search input", () => {
    render(<RoomSidebar data={mockData} searchQuery="" onSearchChange={() => {}} minCapacity={1} onMinCapacityChange={() => {}} />);
    expect(screen.getByPlaceholderText(/search/i)).toBeTruthy();
  });
});
