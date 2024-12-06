import React, { useState } from "react";
import { Users2Icon, StarIcon, TrophyIcon, SwordIcon } from "lucide-react";

interface Room {
  id: string;
  name: string;
  players: number;
  maxPlayers: number;
  stake: number;
  prize: number;
  status: "waiting" | "playing" | "full";
}

const DEMO_ROOMS: Room[] = [
  {
    id: "1",
    name: "Asteroid Battle",
    players: 2,
    maxPlayers: 4,
    stake: 1,
    prize: 5,
    status: "waiting",
  },
  {
    id: "2",
    name: "Space Race",
    players: 3,
    maxPlayers: 3,
    stake: 2,
    prize: 8,
    status: "full",
  },
  {
    id: "3",
    name: "Cosmic Duel",
    players: 1,
    maxPlayers: 2,
    stake: 5,
    prize: 12,
    status: "waiting",
  },
];

export default function RoomPage() {
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isTelegram = window.Telegram?.WebApp !== undefined;

  const handleJoinRoom = async (room: Room) => {
    if (!isTelegram) {
      setError("Please open this app in Telegram");
      return;
    }

    setIsJoining(true);
    setError(null);
    setSelectedRoom(room);

    try {
      const result = await window.Telegram.WebApp.requestStars({
        amount: room.stake,
        purpose: "Game Room Entry",
        description: `Join ${room.name} (${room.stake} Stars stake)`,
      });

      if (result.success) {
        window.Telegram.WebApp.HapticFeedback.notificationOccurred("success");
        // Here you would typically connect to the game room
      } else {
        throw new Error("Failed to join room");
      }
    } catch (err) {
      setError("Failed to join the room. Please try again.");
      window.Telegram.WebApp.HapticFeedback.notificationOccurred("error");
    } finally {
      setIsJoining(false);
    }
  };

  const getRoomStatusColor = (status: Room["status"]) => {
    switch (status) {
      case "waiting":
        return "text-green-400";
      case "playing":
        return "text-yellow-400";
      case "full":
        return "text-red-400";
      default:
        return "text-gray-400";
    }
  };

  return (
    <div className="flex flex-col h-full p-4 space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent mb-2">
          Game Rooms
        </h2>
        <p className="text-indigo-200/70">Join a room to play with others</p>
      </div>

      <div className="grid gap-4">
        {DEMO_ROOMS.map((room) => (
          <div
            key={room.id}
            className="bg-gradient-to-r from-indigo-950/90 to-blue-950/90 backdrop-blur-md rounded-2xl border border-indigo-800/30 p-4 shadow-lg"
          >
            <div className="flex flex-col space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-semibold text-white mb-1">
                    {room.name}
                  </h3>
                  <div className="flex items-center space-x-2 text-sm">
                    <Users2Icon className="w-4 h-4 text-indigo-400" />
                    <span className="text-indigo-200">
                      {room.players}/{room.maxPlayers} players
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs ${getRoomStatusColor(
                        room.status
                      )}`}
                    >
                      {room.status}
                    </span>
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  <div className="text-center">
                    <div className="flex items-center space-x-1 text-yellow-400">
                      <StarIcon className="w-4 h-4" />
                      <span className="font-semibold">{room.stake}</span>
                    </div>
                    <div className="text-xs text-indigo-200/70">stake</div>
                  </div>

                  <div className="text-center">
                    <div className="flex items-center space-x-1 text-emerald-400">
                      <TrophyIcon className="w-4 h-4" />
                      <span className="font-semibold">{room.prize}</span>
                    </div>
                    <div className="text-xs text-indigo-200/70">prize</div>
                  </div>
                </div>
              </div>

              <button
                onClick={() => handleJoinRoom(room)}
                disabled={isJoining || room.status === "full" || !isTelegram}
                className={`w-full py-2 px-4 rounded-xl flex items-center justify-center space-x-2 transition-all
                  ${
                    room.status === "full"
                      ? "bg-gray-800/50 cursor-not-allowed"
                      : "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 active:scale-[0.98]"
                  }`}
              >
                <SwordIcon className="w-5 h-5" />
                <span>
                  {room.status === "full" ? "Room Full" : "Join Game"}
                </span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {error && (
        <div className="p-4 bg-red-500/20 border border-red-500/30 rounded-xl text-red-400 text-center">
          {error}
        </div>
      )}

      {!isTelegram && (
        <div className="p-4 bg-indigo-900/30 border border-indigo-800/30 rounded-xl text-center">
          <p className="text-indigo-200">
            Please open this game in Telegram to join rooms
          </p>
        </div>
      )}
    </div>
  );
}
