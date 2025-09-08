"use client";
import { useEffect, useState } from "react";
import { socket } from "@/lib/socket";

export default function ScoreboardPage() {
  const [scores, setScores] = useState({});
  const [players, setPlayers] = useState({});

  useEffect(() => {
    // Listen for updated game state
    socket.on("game_state", ({ players, scores }) => {
      setScores(scores);
      setPlayers(players);
    });

    return () => {
      socket.off("game_state");
    };
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Scoreboard</h1>
      <ul className="list-decimal ml-6 space-y-2">
        {Object.entries(scores)
          .sort((a, b) => b[1] - a[1]) // Sort high → low
          .map(([id, score]) => (
            <li key={id}>
              {players[id] || "Unknown"} — <span className="font-semibold">{score}</span> points
            </li>
          ))}
      </ul>
    </div>
  );
}
