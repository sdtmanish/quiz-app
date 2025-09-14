"use client";

import { useEffect, useState } from "react";
import { socket } from "../lib/socket";
import { useRouter } from "next/navigation";
import { useGame } from "../context/GameContext";

export default function PlayerLobbyPage() {
  const { roomId, playerName } = useGame();
  const [players, setPlayers] = useState({});
  const [scores, setScores] = useState({});
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (!roomId || !playerName) {
      router.push("/join");
      return;
    }

    if (!socket.connected) socket.connect();
    socket.emit("join_game", { roomId, playerName, isAdmin: false });

    socket.on("game_state", ({ players, scores }) => {
      setPlayers(players);
      setScores(scores);
      setLoading(false);
    });

    socket.on("show_question", ({ question, index }) => {
      router.push("/quiz");
    });

    return () => {
      socket.off("game_state");
      socket.off("show_question");
    };
  }, [roomId, playerName, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-indigo-900 via-purple-900 to-pink-900 text-white font-bold text-xl">
        Waiting for players...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 p-8 flex flex-col items-center">
      <h1 className="text-4xl font-extrabold text-yellow-300 drop-shadow-lg mb-8 text-center">
        Player Lobby
      </h1>

      <div className="flex flex-col md:flex-row gap-8 w-full max-w-5xl">
        {/* Lobby Info */}
        <div className="flex-1 bg-gray-800 bg-opacity-70 backdrop-blur-md p-6 rounded-2xl shadow-xl flex flex-col items-center">
          <p className="text-lg mb-2">
            Room ID:{" "}
            <span className="font-mono font-bold text-indigo-300">
              {roomId}
            </span>
          </p>
          <p className="text-lg mb-4">
            Player:{" "}
            <span className="font-bold text-indigo-200">{playerName}</span>
          </p>
          <p className="text-gray-300 text-center">
            Waiting for the admin to start the quiz...
          </p>
        </div>

        {/* Players List */}
        <div className="flex-1 bg-gray-800 bg-opacity-70 backdrop-blur-md p-6 rounded-2xl shadow-xl flex flex-col">
          <h2 className="text-2xl font-bold mb-4 text-yellow-200">
            Players Joined ({Object.keys(players).length})
          </h2>
          <ul className="space-y-3 flex-1 overflow-y-auto max-h-96">
            {Object.entries(players).map(([id, name]) => (
              <li
                key={id}
                className="bg-gray-700 bg-opacity-80 p-3 rounded-lg flex justify-between items-center hover:bg-indigo-600 transition-all"
              >
                <span className="font-semibold">{name}</span>
                <span className="font-mono text-indigo-300">
                  Score: {scores[id] || 0}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
