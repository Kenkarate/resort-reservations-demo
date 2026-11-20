import RoomRackClient from "./RoomRackClient";
import { createDemoDatabase } from "@/lib/demo-data";

export default function RackPage() {
  const seed = createDemoDatabase();
  return <RoomRackClient initialRooms={seed.rooms} initialReservations={seed.reservations} />;
}
