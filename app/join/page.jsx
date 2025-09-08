"use client";
import { useState } from "react";
import { socket } from "@/lib/socket";
import { useRouter } from "next/navigation"; // Add this import

export default function JoinPage() {
  const [roomId, setRoomId] = useState("");
  const [playerName, setPlayerName] = useState("");
  const router = useRouter(); // Add this line

  // Handles joining an existing room
  const handleJoin = () => {
    if (!roomId || !playerName) return alert("Please enter a room ID and your name.");
    localStorage.setItem("roomId", roomId);
    localStorage.setItem("playerName", playerName);
    localStorage.setItem("isAdmin", "false"); // Set isAdmin to false
    socket.connect();
    socket.emit("join_game", { roomId, playerName, isAdmin: false });
    router.push("/lobby"); // Navigate to the lobby
  };

  // Handles creating a new room
  const handleCreate = () => {
    if (!roomId || !playerName) return alert("Please enter a room ID and your name.");
    localStorage.setItem("roomId", roomId);
    localStorage.setItem("playerName", playerName);
    localStorage.setItem("isAdmin", "true"); // Set isAdmin to true for the creator
    socket.connect();
    socket.emit("join_game", { roomId, playerName, isAdmin: true });
    router.push("/lobby"); // Navigate to the lobby
  };

  return (
    <div className="p-6 flex flex-col gap-4">
      <h1 className="text-2xl font-bold">Join or Create Game</h1>
      <input
        className="border p-2 rounded"
        value={roomId}
        onChange={(e) => setRoomId(e.target.value)}
        placeholder="Room ID"
      />
      <input
        className="border p-2 rounded"
        value={playerName}
        onChange={(e) => setPlayerName(e.target.value)}
        placeholder="Your Name"
      />
      <button
        onClick={handleJoin}
        className="bg-blue-500 text-white px-4 py-2 rounded"
      >
        Join Room
      </button>
      <button
        onClick={handleCreate}
        className="bg-green-500 text-white px-4 py-2 rounded"
      >
        Create Room
      </button>
    </div>
  );
}