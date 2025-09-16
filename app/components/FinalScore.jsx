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
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 text-white flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full mb-6 animate-bounce">
            <span className="text-4xl">🏁</span>
          </div>
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
            Quiz Complete!
          </h1>
          <p className="text-xl text-gray-300 mb-8">
            Congratulations to all participants! 🎉
          </p>
        </div>

        {/* Final Leaderboard */}
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 shadow-2xl border border-white/20 mb-8">
          <div className="flex items-center justify-center space-x-2 mb-6">
            <span className="text-3xl">🏆</span>
            <h2 className="text-2xl font-bold text-yellow-400">Final Leaderboard</h2>
          </div>

          {sortedPlayers.length > 0 ? (
            <div className="space-y-4">
              {sortedPlayers.map((playerId, index) => (
                <div
                  key={playerId}
                  className={`flex items-center justify-between p-6 rounded-xl transition-all duration-300 ${
                    index === 0
                      ? "bg-gradient-to-r from-yellow-500/30 to-orange-500/30 border-2 border-yellow-400/50 transform scale-105"
                      : index === 1
                      ? "bg-gradient-to-r from-gray-400/20 to-gray-500/20 border-2 border-gray-400/50"
                      : index === 2
                      ? "bg-gradient-to-r from-orange-600/20 to-red-600/20 border-2 border-orange-400/50"
                      : "bg-white/5 border border-white/10"
                  }`}
                >
                  <div className="flex items-center space-x-4">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold ${
                      index === 0 ? "bg-yellow-500 text-black animate-pulse" :
                      index === 1 ? "bg-gray-400 text-black" :
                      index === 2 ? "bg-orange-600 text-white" :
                      "bg-blue-600 text-white"
                    }`}>
                      {index + 1}
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-xl font-bold">
                          {players[playerId] || "Unknown Player"}
                        </span>
                        {index === 0 && <span className="text-3xl animate-bounce">👑</span>}
                        {index === 1 && <span className="text-2xl">🥈</span>}
                        {index === 2 && <span className="text-2xl">🥉</span>}
                      </div>
                      <p className="text-sm text-gray-400">
                        {index === 0 ? "Champion!" : 
                         index === 1 ? "Runner-up" : 
                         index === 2 ? "Third place" : 
                         "Great effort!"}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold text-green-400">
                      {scores[playerId] ?? 0}
                    </div>
                    <p className="text-sm text-gray-400">points</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <span className="text-6xl mb-4 block">😴</span>
              <p className="text-xl text-gray-400 mb-2">No participants found</p>
              <p className="text-sm text-gray-500">The quiz ended without any active players.</p>
            </div>
          )}
        </div>

        {/* Action Button */}
        {onRestart && (
          <div className="text-center">
            <button
              onClick={onRestart}
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-bold py-4 px-8 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
            >
              <span className="mr-2">🎯</span>
              Join Another Quiz
            </button>
          </div>
        )}

        {/* Celebration Animation */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-1/4 left-1/4 text-4xl animate-bounce" style={{ animationDelay: '0s' }}>🎉</div>
          <div className="absolute top-1/3 right-1/4 text-4xl animate-bounce" style={{ animationDelay: '1s' }}>🎊</div>
          <div className="absolute bottom-1/4 left-1/3 text-4xl animate-bounce" style={{ animationDelay: '2s' }}>✨</div>
          <div className="absolute bottom-1/3 right-1/3 text-4xl animate-bounce" style={{ animationDelay: '0.5s' }}>🎈</div>
        </div>
      </div>
    </div>
  );
}
