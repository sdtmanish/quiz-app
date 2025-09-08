"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { socket } from "@/lib/socket";

export default function JoinPage() {
  const [roomId, setRoomId] = useState("");
  const [playerName, setPlayerName] = useState("");
  const router = useRouter();

  const handleJoin = () => {
    if (!roomId || !playerName) return;

    socket.connect();
    socket.emit("join_game", { roomId, playerName, isAdmin: false });

    // Save info in localStorage for later pages
    localStorage.setItem("roomId", roomId);
    localStorage.setItem("playerName", playerName);

    // Go to lobby
    router.push("/lobby");
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen gap-4">
      <h1 className="text-3xl font-bold">Join a Quiz</h1>
      <input
        className="border p-2 rounded w-64"
        value={roomId}
        onChange={(e) => setRoomId(e.target.value)}
        placeholder="Enter Room ID"
      />
      <input
        className="border p-2 rounded w-64"
        value={playerName}
        onChange={(e) => setPlayerName(e.target.value)}
        placeholder="Enter Your Name"
      />
      <button
        onClick={handleJoin}
        className="bg-blue-500 text-white px-4 py-2 rounded w-64"
      >
        Join Game
      </button>
    </div>
  );
}
