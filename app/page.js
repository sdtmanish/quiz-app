'use client';

import { useState } from "react";
import { socket } from "./lib/socket";
import { useRouter } from "next/navigation";
import { useGame } from "./context/GameContext";

export default function JoinPage() {
  const [playerName, setPlayerName] = useState("");
  const [roomId, setRoomId] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const { setPlayer, setRoom } = useGame();
  const router = useRouter();

  const handleJoinRoom = () => {
    if (!playerName || !roomId) {
      alert("Please enter your name and Room ID");
      return;
    }

    setIsLoading(true);

    if (!socket.connected) socket.connect();

    socket.once("room_not_found", () => {
      alert("Room not found! Please check the Room ID.");
      setIsLoading(false);
    });

    socket.once("admin_exists", () => {
      alert("Admin already exists for this room!");
      setIsLoading(false);
    });

    // socket.emit("join_game", { roomId, playerName, isAdmin: false });

    setPlayer(playerName);
    setRoom(roomId);

    router.push("/player-lobby");
  };

  return (
    <div className="relative flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white font-sans p-4">
      
      {/* ✅ Login button pinned to top-right */}
      <button
        className="absolute top-4 right-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded-lg shadow-md transition-colors duration-300"
        onClick={() => router.push("/login")}   // ✅ fixed
      >
        Login
      </button>

      <div className="bg-gray-800 p-8 rounded-2xl shadow-lg border border-gray-700 w-full max-w-sm space-y-6">
        <h1 className="text-3xl font-extrabold text-center text-indigo-400">
          Join Cohort
        </h1>

        <input
          className="w-full bg-gray-700 text-white placeholder-gray-400 border border-gray-600 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          value={playerName}
          onChange={(e) => setPlayerName(e.target.value)}
          placeholder="Your Name"
        />

        <input
          className="w-full bg-gray-700 text-white placeholder-gray-400 border border-gray-600 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          value={roomId}
          onChange={(e) => setRoomId(e.target.value)}
          placeholder="Room ID"
        />

        <button
          onClick={handleJoinRoom}
          disabled={isLoading}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg shadow-md transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
        >
          {isLoading ? "Joining..." : "Join Cohort"}
        </button>
      </div>
    </div>
  );
}
