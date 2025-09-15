"use client";
import React from "react";

export default function FinalScores({
  scores = {},          // ensure it's always an object
  players = {},         // same here
  onRestart,
}) {
  // Sort players by score (descending)
  const sortedPlayers = Object.keys(scores).sort(
    (a, b) => (scores[b] || 0) - (scores[a] || 0)
  );

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8 flex flex-col items-center justify-center">
      <h1 className="text-4xl font-bold mb-8">🏁 Quiz Ended!</h1>
      <h2 className="text-2xl font-semibold mb-4">Final Leaderboard 🏆</h2>

      <div className="w-full max-w-md bg-gray-800 rounded-lg shadow-lg p-6">
        {sortedPlayers.length > 0 ? (
          sortedPlayers.map((playerId, index) => (
            <div
              key={playerId}
              className="flex justify-between items-center py-2 border-b border-gray-700 last:border-b-0"
            >
              <span className="text-xl font-medium">
                {index + 1}.{" "}
                {players[playerId] || "Unknown"}{" "}
                {index === 0 && "👑"}
              </span>
              <span className="text-xl font-bold text-green-400">
                {scores[playerId] ?? 0}
              </span>
            </div>
          ))
        ) : (
          <p className="text-center text-gray-400">No scores to display.</p>
        )}
      </div>

      {onRestart && (
        <button
          onClick={onRestart}
          className="mt-8 bg-blue-600 hover:bg-blue-700 py-3 px-6 rounded-lg font-bold transition-colors"
        >
          Join a New Quiz
        </button>
      )}
    </div>
  );
}
