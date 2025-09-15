"use client";

import { useEffect, useState } from "react";
import { socket } from "../../lib/socket";
import { useRouter } from "next/navigation";
import { useGame } from "../../context/GameContext";

export default function AdminQuestionsPage() {
  const { roomId, adminName } = useGame();
  const router = useRouter();

  const [players, setPlayers] = useState({});
  const [questions, setQuestions] = useState({});
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (!roomId || !adminName) {
      router.push("/admin-dashboard/create-room");
      return;
    }

    if (!socket.connected) socket.connect();

    console.log("📡 Admin joining room...");
    socket.emit("join_game", {
      roomId,
      playerName: adminName,
      isAdmin: true,
    });

    // Make this the primary handler for all state updates
    socket.on("game_state", (data) => {
      console.log("📝 Received game_state for admin", data);
      setPlayers(data.players || {});
      setQuestions(data.questions || {});
      setCurrentIndex(data.currentQuestionIndex || 0);
    });

    socket.on("score_update", (updatedScores) => {
      console.log("🏆 Scores updated", updatedScores);
    });

    socket.on("quiz_ended", () => {
      console.log("🏁 Quiz ended");
    });

    socket.on("room_not_found", () => {
      alert("Room not found");
      router.push("/");
    });

    return () => {
      socket.off("game_state");
      socket.off("score_update");
      socket.off("quiz_ended");
      socket.off("room_not_found");
    };
  }, [roomId, adminName, router]);

  const handleNext = () => {
    console.log("➡️ Admin moving to next question");
    socket.emit("next_question", { roomId });
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <h1 className="text-2xl font-bold mb-6">Admin Question Dashboard</h1>

      <div className="space-y-4 mb-8">
        {Object.keys(players).map((id) => (
          <div key={id} className="bg-gray-800 p-4 rounded-lg shadow-md">
            <h2 className="text-lg font-semibold">Player: {players[id]}</h2>
            <p className="text-gray-300 mt-2">
              Question {currentIndex + 1}:{" "}
              {questions[id]?.[currentIndex]?.question || "Loading..."}
            </p>
            <p className="text-gray-300">
              Answer: {questions[id]?.[currentIndex]?.answer || "Not available"}
            </p>
          </div>
        ))}
      </div>

      <button
        onClick={handleNext}
        className="bg-green-600 hover:bg-green-700 py-3 px-6 rounded-lg font-bold"
      >
        Next Question
      </button>
    </div>
  );
}