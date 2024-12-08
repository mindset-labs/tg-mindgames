import Navigation from "../../../components/Navigation";
import { useState, useEffect } from "react";

interface Room {
  id: string;
  name: string;
  players: number;
  maxPlayers: number;
  status: "waiting" | "in-progress";
}

export const Rooms = () => {
  const [rooms, setRooms] = useState<Room[]>([]);

  // Mock data - replace with actual API call
  useEffect(() => {
    setRooms([
      {
        id: "1",
        name: "Game Room 1",
        players: 2,
        maxPlayers: 4,
        status: "waiting",
      },
      {
        id: "2",
        name: "Game Room 2",
        players: 4,
        maxPlayers: 4,
        status: "in-progress",
      },
      {
        id: "3",
        name: "Game Room 3",
        players: 1,
        maxPlayers: 2,
        status: "waiting",
      },
    ]);
  }, []);

  return (
    <div className="flex flex-col min-h-screen w-full bg-gradient-to-b from-[#160f28] to-black">
      <Navigation />

      <div className="flex flex-col items-center p-8">
        <h1 className="text-3xl font-bold text-white mb-8">Available Rooms</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-6xl">
          {rooms.map((room) => (
            <div
              key={room.id}
              className="bg-gray-800 rounded-lg p-6 hover:bg-gray-700 transition-colors cursor-pointer"
            >
              <h2 className="text-xl font-semibold text-white mb-2">
                {room.name}
              </h2>
              <div className="text-gray-300">
                <p>
                  Players: {room.players}/{room.maxPlayers}
                </p>
                <p
                  className={`mt-2 ${
                    room.status === "waiting"
                      ? "text-green-400"
                      : "text-yellow-400"
                  }`}
                >
                  Status:{" "}
                  {room.status === "waiting"
                    ? "Waiting for players"
                    : "Game in progress"}
                </p>
              </div>
            </div>
          ))}
        </div>

        <button className="mt-8 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg transition-colors">
          Create New Room
        </button>
      </div>
    </div>
  );
};
