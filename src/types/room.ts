export interface Room {
  readonly id: string;
  readonly displayName: string;
  readonly emailAddress: string;
  readonly building: string;
  readonly floorNumber: number;
  readonly capacity: number;
}

export interface RoomGroup {
  readonly label: string;
  readonly rooms: readonly Room[];
}

export interface GroupedRooms {
  readonly groups: readonly RoomGroup[];
  readonly totalCount: number;
}
