"use client";

import { useEffect, useState } from "react";
import { socket } from "../../lib/socket";
import { useRouter } from "next/navigation";
import { useGame } from "../../context/GameContext"; // your context hook
import QRCode from "react-qr-code";

export default function AdminLobbyPage() {
  const { roomId, adminName } = useGame();
  const [players, setPlayers] = useState({});
  const [scores, setScores] = useState({});
  const [loading, setLoading] = useState(true);
  const router = useRouter();

useEffect(() => {
  // Check admin authentication
  const token = localStorage.getItem("adminToken");
  if (!token) {
    router.push("/login");
    return;
  }

  if (!roomId || !adminName) {
    router.push("/admin-dashboard/create-room");
    return;
  }

  if (!socket.connected) socket.connect();

  // Admin joins the room (only once)
  socket.emit("join_game", { roomId, playerName: adminName, isAdmin: true });

  // Listeners
  const handleGameState = (data) => {
    const filteredPlayers = { ...data.players };
    if (data.adminId in filteredPlayers) {
      delete filteredPlayers[data.adminId];
    }
    setPlayers(filteredPlayers);
    setScores(data.scores || {});
    setLoading(false);
  };

  const handleNoQuestions = () => {
    alert("No questions found! Add questions first.");
    setLoading(false);
  };

  const handleShowQuestion = () => {
    router.push("/quiz");
  };

  socket.on("game_state", handleGameState);
  socket.on("no_questions_found", handleNoQuestions);
  socket.on("show_question", handleShowQuestion);

  return () => {
    socket.off("game_state", handleGameState);
    socket.off("no_questions_found", handleNoQuestions);
    socket.off("show_question", handleShowQuestion);
  };
}, []); // ✅ empty deps: run once


  const handleStartQuiz = () => {
    socket.emit("start_quiz", { roomId });
    router.push("/admin-dashboard/admin-quiz");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-indigo-900 via-purple-900 to-pink-900 text-white font-bold text-xl">
        Loading lobby...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 text-white p-8 flex flex-col items-center justify-center">
      <audio id="bg-music" src="/assets/Escapism.mp3" autoPlay loop />

      <h1 className="text-4xl font-extrabold text-center text-yellow-300 mb-8 drop-shadow-lg">
        Admin Lobby
      </h1>

      <div className="flex flex-col md:flex-row gap-8 w-full max-w-7xl">
        {/* Lobby Info & QR */}
        <div className="flex-1 bg-gray-800 bg-opacity-70 backdrop-blur-md p-6 rounded-2xl shadow-xl flex flex-col items-center">
          
          <div className="flex flex-row gap-4"><p className="text-lg mb-2">
            Room ID:{" "}
            <span className="font-mono font-bold text-indigo-300">
              {roomId}
            </span>
          </p>
          <p className="text-lg mb-4">
            Admin:{" "}
            <span className="font-bold text-indigo-200">{adminName}</span>
          </p>
          </div>

          {/* QR Code */}
          {roomId && (
            <div className="bg-white p-4 rounded-lg shadow-lg">
              <QRCode
               value={`${window.location.origin}/?roomId=${encodeURIComponent(roomId)}`}
               
               

              />
            </div>
          )}
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

      <button
        onClick={handleStartQuiz}
        className="mt-8 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 py-3 px-8 rounded-full font-extrabold text-lg shadow-xl transition-transform transform hover:scale-105"
      >
        Start Quiz
      </button>
    </div>
  );
}
