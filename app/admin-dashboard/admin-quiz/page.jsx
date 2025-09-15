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
  const [quizOver, setQuizOver] = useState(false);

  useEffect(() => {
    if (!roomId || !adminName) {
      router.push("/admin-dashboard/create-room");
      return;
    }

    if (!socket.connected) socket.connect();

    socket.emit("join_game", {
      roomId,
      playerName: adminName,
      isAdmin: true,
    });

    socket.on("game_state", (data) => {
      setPlayers(data.players || {});
      setQuestions(data.questions || {});
      setScores(data.scores || {});
      setCurrentIndex(data.currentQuestionIndex || 0);
      setAdminEliminatedOptions(data.eliminatedOptions || {});
      if (
        data.isQuizActive === false &&
        data.currentQuestionIndex >= (data.adminQuestionList?.length ?? 0) - 1
      ) {
        setQuizOver(true);
      }
    });

    socket.on("score_update", (updatedScores) => setScores(updatedScores));
    socket.on("quiz_ended", () => setQuizOver(true));
    socket.on("room_not_found", () => {
      alert("Room not found");
      router.push("/");
    });

    socket.on("option_eliminated", ({ optionIndex, targetPlayerId }) => {
      setAdminEliminatedOptions((prev) => {
        const current = prev[targetPlayerId] || [];
        return current.includes(optionIndex)
          ? prev
          : { ...prev, [targetPlayerId]: [...current, optionIndex] };
      });
    });

    socket.on("show_question", () => setAdminEliminatedOptions({}));

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
    socket.emit("next_question", { roomId });
    setAdminEliminatedOptions({});
  };

  const handleExit = () => {
    router.push("/admin-dashboard/create-room");
  };

  const handleEliminateOption = (playerId, optionIndex) => {
    socket.emit("eliminate_option", { roomId, targetPlayerId: playerId, optionIndex });
    setAdminEliminatedOptions((prev) => {
      const current = prev[playerId] || [];
      return current.includes(optionIndex)
        ? prev
        : { ...prev, [playerId]: [...current, optionIndex] };
    });
  };

  /** Renders question & media for a single player's current question */
  const renderQuestionContent = (q) => {
    if (!q) return <p className="text-gray-400">Loading question...</p>;

    switch (q.type) {
      case "image":
        return (
          <div>
            <p className="font-semibold mb-2">{q.question}</p>
            {q.mediaUrl && (
              <img
                src={q.mediaUrl}
                alt="Question media"
                className="max-h-64 rounded-lg shadow-lg"
              />
            )}
          </div>
        );
      case "audio":
        return (
          <div>
            <p className="font-semibold mb-2">{q.question}</p>
            {q.mediaUrl && (
              <audio controls className="w-full">
                <source src={q.mediaUrl} type="audio/mpeg" />
                Your browser does not support audio.
              </audio>
            )}
          </div>
        );
      case "video":
        return (
          <div>
            <p className="font-semibold mb-2">{q.question}</p>
            {q.mediaUrl && (
              <video
                controls
                className="max-h-72 w-full rounded-lg shadow-lg"
              >
                <source src={q.mediaUrl} type="video/mp4" />
                Your browser does not support video.
              </video>
            )}
          </div>
        );
      default:
        return <p className="font-semibold">{q.question}</p>;
    }
  };

  // ---------- Final Scoreboard ------------
  if (quizOver) {
    const sortedScores = Object.entries(scores).sort((a, b) => b[1] - a[1]);
    return (
      <div className="min-h-screen bg-gray-900 text-white p-8 flex flex-col items-center">
        <h2 className="text-3xl font-bold mb-6">🏆 Final Scoreboard</h2>
        <p className="mb-4">
          Room ID: <span className="font-semibold">{roomId}</span>
        </p>
        <div className="w-full max-w-md bg-gray-800 rounded-lg p-6 shadow-lg">
          {sortedScores.length === 0 ? (
            <p className="text-gray-400">No players participated.</p>
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

  // ---------- Main Admin View ------------
  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <h1 className="text-2xl font-bold mb-6">Admin Question Dashboard</h1>
      <p className="mb-4">
        Room ID: <span className="font-semibold">{roomId}</span>
      </p>

      {/* Live Scoreboard */}
      <div className="bg-gray-800 p-4 rounded-lg shadow-md mb-8">
        <h2 className="text-xl font-bold mb-4">🏆 Live Scoreboard</h2>
        {Object.keys(scores).length === 0 ? (
          <p className="text-gray-400">No scores yet...</p>
        ) : (
          <div className="space-y-2">
            {Object.entries(scores)
              .sort(([, a], [, b]) => b - a)
              .map(([id, score]) => (
                <div
                  key={id}
                  className="flex justify-between items-center p-2 bg-gray-700 rounded-md"
                >
                  <span className="font-semibold">{players[id] || "Unknown"}</span>
                  <span className="text-green-400 font-bold">{score}</span>
                </div>
              ))}
          </div>
        )}
      </div>

      {/* Player-specific question + elimination controls */}
      <div className="space-y-6 mb-8">
        {Object.keys(players).map((id) => {
          const currentQ = questions[id]?.[currentIndex];
          return (
            <div key={id} className="bg-gray-800 p-4 rounded-lg shadow-md">
              <h2 className="text-lg font-semibold mb-2">
                Player: {players[id]}
              </h2>

              {/* ✅ Render question and media */}
              {renderQuestionContent(currentQ)}

              <div className="flex flex-wrap gap-2 mt-3 items-center">
                <p className="text-sm font-semibold text-gray-400 shrink-0">
                  Eliminate:
                </p>
                {currentQ?.options?.map((opt, i) => {
                  const eliminated = adminEliminatedOptions[id]?.includes(i);
                  const btnClass = `py-1 px-3 rounded text-sm font-bold transition ${
                    eliminated
                      ? "bg-red-800 border border-red-500 text-red-100 line-through cursor-not-allowed"
                      : "bg-red-600 hover:bg-red-700 text-white"
                  }`;
                  return (
                    <button
                      key={i}
                      onClick={() => handleEliminateOption(id, i)}
                      className={btnClass}
                      disabled={eliminated}
                    >
                      {i + 1}. {opt}
                    </button>
                  );
                })}
              </div>

              {currentQ?.answer && (
                <p className="text-gray-300 mt-2">
                  Correct Answer: {currentQ.answer}
                </p>
              )}
            </div>
          );
        })}
      </div>

      {/* Navigation Buttons */}
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
