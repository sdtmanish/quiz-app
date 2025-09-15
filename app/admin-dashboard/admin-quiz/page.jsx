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
  const [scores, setScores] = useState({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [adminEliminatedOptions, setAdminEliminatedOptions] = useState({});
  const [quizOver, setQuizOver] = useState(false); // ✅ New state to track if the quiz is over

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

    socket.on("game_state", (data) => {
      console.log("📝 Received game_state for admin", data);
      setPlayers(data.players || {});
      setQuestions(data.questions || {});
      setScores(data.scores || {});
      setCurrentIndex(data.currentQuestionIndex || 0);
      setAdminEliminatedOptions(data.eliminatedOptions || {});
      // Check if the quiz is already over from the game state
      if (data.isQuizActive === false && data.currentQuestionIndex >= data.adminQuestionList.length - 1) {
          setQuizOver(true);
      }
    });

    socket.on("score_update", (updatedScores) => {
      console.log("🏆 Scores updated", updatedScores);
      setScores(updatedScores);
    });

    socket.on("quiz_ended", () => {
      console.log("🏁 Quiz ended");
      setQuizOver(true); // ✅ Set quizOver to true when the event is received
    });

    socket.on("room_not_found", () => {
      alert("Room not found");
      router.push("/");
    });

    socket.on("option_eliminated", ({ optionIndex, targetPlayerId }) => {
        console.log(`❌ Admin received option_eliminated for player ${targetPlayerId}, option ${optionIndex}`);
        setAdminEliminatedOptions(prev => {
            const currentEliminated = prev[targetPlayerId] || [];
            if (!currentEliminated.includes(optionIndex)) {
                return {
                    ...prev,
                    [targetPlayerId]: [...currentEliminated, optionIndex]
                };
            }
            return prev;
        });
    });

    socket.on("show_question", () => {
        setAdminEliminatedOptions({});
    });


    return () => {
      socket.off("game_state");
      socket.off("score_update");
      socket.off("quiz_ended");
      socket.off("room_not_found");
      socket.off("option_eliminated");
      socket.off("show_question");
    };
  }, [roomId, adminName, router]);

  const handleNext = () => {
    console.log("➡️ Admin moving to next question");
    socket.emit("next_question", { roomId });
    setAdminEliminatedOptions({});
  };

  const handleExit = () => {
    router.push("/admin-dashboard/create-room");
  };

  const handleEliminateOption = (playerId, optionIndex) => {
    console.log(`➡️ Admin eliminating option ${optionIndex} for player ${playerId}`);
    socket.emit("eliminate_option", {
      roomId,
      targetPlayerId: playerId,
      optionIndex,
    });
    setAdminEliminatedOptions(prev => {
        const currentEliminated = prev[playerId] || [];
        if (!currentEliminated.includes(optionIndex)) {
            return {
                ...prev,
                [playerId]: [...currentEliminated, optionIndex]
            };
        }
        return prev;
    });
  };

  // ✅ Conditional rendering for the final scoreboard
  if (quizOver) {
    const sortedScores = Object.entries(scores).sort((a, b) => b[1] - a[1]);

    return (
      <div className="min-h-screen bg-gray-900 text-white p-8 flex flex-col items-center">
        <h2 className="text-3xl font-bold mb-6">🏆 Final Scoreboard</h2>
        <p className="mb-4">
          Room ID: <span className="font-semibold">{roomId}</span>
        </p>
        <div className="w-full max-w-md bg-gray-800 rounded-lg p-6 shadow-lg">
          {Object.keys(scores).length === 0 ? (
            <p className="text-gray-400">No players in the game.</p>
          ) : (
            <div className="space-y-2">
              {sortedScores.map(([id, score], idx) => (
                <div
                  key={id}
                  className="flex justify-between p-3 border-b border-gray-700 last:border-none"
                >
                  <span className="font-semibold">
                    {idx + 1}. {players[id] || "Unknown"}
                  </span>
                  <span className="text-green-400">{score}</span>
                </div>
              ))}
            </div>
          )}
        </div>
        <button
          onClick={handleExit}
          className="mt-6 bg-red-600 hover:bg-red-700 py-3 px-6 rounded-lg font-bold"
        >
          Exit Room
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <h1 className="text-2xl font-bold mb-6">Admin Question Dashboard</h1>
      <p className="mb-4">
        Room ID: <span className="font-semibold">{roomId}</span>
      </p>

      <div className="bg-gray-800 p-4 rounded-lg shadow-md mb-8">
        <h2 className="text-xl font-bold mb-4">🏆 Live Scoreboard</h2>
        {Object.keys(scores).length === 0 ? (
          <p className="text-gray-400">No scores yet...</p>
        ) : (
          <div className="space-y-2">
            {Object.entries(scores)
              .sort(([, scoreA], [, scoreB]) => scoreB - scoreA)
              .map(([id, score]) => (
                <div
                  key={id}
                  className="flex justify-between items-center p-2 bg-gray-700 rounded-md"
                >
                  <span className="font-semibold">
                    {players[id] || "Unknown Player"}
                  </span>
                  <span className="text-green-400 font-bold">{score}</span>
                </div>
              ))}
          </div>
        )}
      </div>

      <div className="space-y-4 mb-8">
        {Object.keys(players).map((id) => (
          <div key={id} className="bg-gray-800 p-4 rounded-lg shadow-md">
            <h2 className="text-lg font-semibold">
              Player: {players[id]}
            </h2>

            <div className="flex flex-wrap gap-2 mt-2 items-center">
              <p className="text-sm font-semibold text-gray-400 shrink-0">Eliminate:</p>
              {questions[id]?.[currentIndex]?.options.map((opt, i) => {
                const isOptionEliminated = adminEliminatedOptions[id]?.includes(i);
                const buttonClass = `py-1 px-3 rounded text-sm font-bold transition
                  ${isOptionEliminated
                    ? "bg-red-800 border border-red-500 text-red-100 line-through cursor-not-allowed"
                    : "bg-red-600 hover:bg-red-700 text-white"
                  }`;

                return (
                  <button
                    key={i}
                    onClick={() => handleEliminateOption(id, i)}
                    className={buttonClass}
                    disabled={isOptionEliminated}
                  >
                    {i + 1}. {opt}
                  </button>
                );
              })}
            </div>
            
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

      <div className="flex justify-between mt-6">
        <button
          onClick={handleNext}
          className="bg-green-600 hover:bg-green-700 py-3 px-6 rounded-lg font-bold"
        >
          Next Question
        </button>
        <button
          onClick={handleExit}
          className="bg-red-600 hover:bg-red-700 py-3 px-6 rounded-lg font-bold"
        >
          Exit
        </button>
      </div>
    </div>
  );
}