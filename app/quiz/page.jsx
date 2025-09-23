"use client";

import { useEffect, useState, useRef } from "react";
import { socket } from "../lib/socket";
import { useRouter } from "next/navigation";
import { useGame } from "../context/GameContext";
import FinalScores from "../components/FinalScore";

export default function QuizPage() {
  const { roomId, playerName, adminName } = useGame();
  const effectiveName = playerName || adminName;

  const [question, setQuestion] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selected, setSelected] = useState(null);
  const [scores, setScores] = useState({});
  const [players, setPlayers] = useState({});
  const [joined, setJoined] = useState(false);
  const [adminId, setAdminId] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [eliminatedOptions, setEliminatedOptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [quizEnded, setQuizEnded] = useState(false);
  const [answerSubmitted, setAnswerSubmitted] = useState(false);
  const [correctAnswer, setCorrectAnswer] = useState(null);
  const [eliminationsPerPlayer, setEliminationsPerPlayer] = useState(0);
  const [eliminationsUsed, setEliminationsUsed] = useState({});
  const [requestedThisQuestion, setRequestedThisQuestion] = useState(false);

  const router = useRouter();
  const hasJoinedRef = useRef(false);

  useEffect(() => {
    if (!roomId || !effectiveName) {
      router.push("/");
      return;
    }

    if (!socket.connected) {
      socket.connect();
    }

    if (!hasJoinedRef.current) {
      socket.emit("join_game", {
        roomId,
        playerName: effectiveName,
        isAdmin: adminName === effectiveName,
        gameId: localStorage.getItem(`gameId-${roomId}`) || Date.now().toString(),
      });
      hasJoinedRef.current = true;
    }

    socket.on("game_state", (data) => {
      setScores(data.scores || {});
      setPlayers(data.players || {});
      setJoined(true);
      setAdminId(data.adminId);
      const isCurrentUserAdmin = socket.id === data.adminId;
      setIsAdmin(isCurrentUserAdmin);
      setLoading(false);

      setEliminationsPerPlayer(data.eliminationsPerPlayer || 0);
      setEliminationsUsed(data.eliminationsUsed || {});

      if (isCurrentUserAdmin && data.questions && data.questions[socket.id]) {
        setQuestion(data.questions[socket.id]);
        setCurrentIndex(data.currentQuestionIndex);
      }
    });

socket.on("show_question", ({ question, index, eliminationsUsed, eliminationsPerPlayer }) => {
  setQuizEnded(false);
  setQuestion(question);
  setCurrentIndex(index);
  setSelected(null);
  setEliminatedOptions([]);
  setAnswerSubmitted(false);
  setCorrectAnswer(null);
  setRequestedThisQuestion(false);

  // ✅ Keep elimination counts fresh
  if (typeof eliminationsPerPlayer !== "undefined") {
    setEliminationsPerPlayer(eliminationsPerPlayer);
  }
  if (eliminationsUsed) {
    setEliminationsUsed(eliminationsUsed);
  }
});
    socket.on("score_update", (updatedScores) => {
      setScores(updatedScores);
    });

    socket.on("quiz_ended", (finalScores) => {
      setScores(finalScores);
      setQuizEnded(true);
      setQuestion(null);
      alert("The quiz has ended!");
    });

    socket.on("no_questions_found", () => {
      alert("No questions found in the database.");
      router.push(isAdmin ? "/admin-dashboard/admin-lobby" : "/");
    });

    socket.on("room_not_found", () => {
      alert("Room not found. Please check the room ID.");
      router.push("/");
    });

    socket.on("option_eliminated", ({ optionIndex }) => {
      setEliminatedOptions((prev) => [...prev, optionIndex]);
    });

    socket.on("option_restored", ({ optionIndex }) => {
      setEliminatedOptions((prev) => prev.filter((idx) => idx !== optionIndex));
    });

    socket.on("answer_result", ({ correctAnswer }) => {
      setCorrectAnswer(correctAnswer);
      setAnswerSubmitted(true);
    });

    socket.on("elimination_denied", ({ message }) => {
      alert(message);
    });

    return () => {
      socket.off("game_state");
      socket.off("show_question");
      socket.off("score_update");
      socket.off("quiz_ended");
      socket.off("no_questions_found");
      socket.off("room_not_found");
      socket.off("option_eliminated");
      socket.off("option_restored");
      socket.off("answer_result");
      socket.off("elimination_denied");
    };
  }, [roomId, effectiveName, adminName, router, isAdmin]);

  const handleSubmit = (answerIndex) => {
    if (!isAdmin && !answerSubmitted) {
      setSelected(answerIndex);
      socket.emit("submit_answer", { roomId, answer: answerIndex });
    }
  };

  const handleNext = () => {
    if (isAdmin) {
      socket.emit("next_question", { roomId });
    }
  };

  const handleEliminationReq = () => {
    if ((eliminationsUsed[socket.id] || 0) >= eliminationsPerPlayer) {
      alert("You have used all your eliminations!");
      return;
    }
    if (requestedThisQuestion) {
      alert("Already requested for this question!");
      return;
    }
    socket.emit("request_elimination", { roomId, playerId: socket.id });
    setRequestedThisQuestion(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 text-white">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-500/20 rounded-full mb-4 animate-pulse">
            <div className="w-8 h-8 border-4 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
          </div>
          <h2 className="text-2xl font-bold mb-2">Joining Quiz Room</h2>
          <p className="text-gray-300">Please wait while we connect you...</p>
        </div>
      </div>
    );
  }

  if (quizEnded) {
    return (
      <FinalScores
        scores={scores}
        players={players}
        onRestart={() => router.push("/")}
      />
    );
  }

  if (!question) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-purple-900 text-white">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-500/20 rounded-full mb-6 animate-bounce">
            <span className="text-4xl">⏳</span>
          </div>
          <h2 className="text-3xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            Get Ready!
          </h2>
          <p className="text-xl text-gray-300 mb-6">
            Waiting for the quiz master to start the quiz...
          </p>
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
            <p className="text-sm text-gray-400">Room ID:</p>
            <p className="text-2xl font-mono font-bold text-blue-400">
              {roomId}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 text-white overflow-hidden">
      <div className="h-screen flex flex-col p-2 sm:p-4">
        {/* HEADER */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-3 sm:mb-4 bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/20 gap-2 sm:gap-0">
          <div className="flex items-center space-x-3">
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-full w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center font-bold text-xs sm:text-sm">
              Q{currentIndex + 1}
            </div>
            <div>
              <p className="text-xs sm:text-sm font-bold">
                Question {currentIndex + 1}
              </p>
              <p className="text-xs text-gray-400">Room: {roomId}</p>
            </div>
          </div>

          <div className="flex flex-row items-center gap-3 ml-auto">
            <div className="flex flex-col items-end">
              <p className="text-xs sm:text-sm font-bold text-yellow-400">
                🏆 Your Score
              </p>
              <p className="text-sm sm:text-lg font-bold text-green-400">
                {scores[socket.id] || 0} pts
              </p>
              <p className="text-xs text-gray-300">
                Eliminations: {eliminationsUsed[socket.id] || 0}/
                {eliminationsPerPlayer}
              </p>
            </div>

            <div
              className={`px-3 sm:px-4 py-2 sm:py-3 border rounded-xl text-sm sm:text-base font-medium 
                ${
                  (eliminationsUsed[socket.id] || 0) >= eliminationsPerPlayer ||
                  requestedThisQuestion
                    ? "border-gray-400 bg-green-500/50 text-gray-100 cursor-not-allowed"
                    : "border-blue-400 bg-blue-500/50 text-blue-100 hover:border-blue-300 hover:cursor-pointer active:text-amber-200 active:border-amber-200 active:scale-95"
                }`}
              onClick={handleEliminationReq}
            >
              {requestedThisQuestion ? "Requested ✅" : "Req for Elimination"}
            </div>
          </div>
        </div>

        {/* MAIN CONTENT */}
        <div className="flex-1 flex flex-col lg:flex-row gap-3 sm:gap-4 min-h-0">
          {/* QUESTION */}
          <div className="flex-1 flex flex-col min-w-0 order-2 lg:order-1">
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 sm:p-4 mb-3 sm:mb-4 border border-white/20">
              {question.type === "text" && (
                <h2 className="text-lg sm:text-xl md:text-2xl font-bold leading-tight">
                  {question.question}
                </h2>
              )}
              {question.type === "image" && (
                <div>
                  <h2 className="text-base sm:text-lg md:text-xl font-bold mb-2 sm:mb-3">
                    {question.question}
                  </h2>
                  <img
                    src={question.mediaUrl}
                    alt="Question Media"
                    className="max-h-24 sm:max-h-32 mx-auto rounded-lg shadow-xl border-2 border-white/20"
                  />
                </div>
              )}
              {question.type === "audio" && (
                <div>
                  <h2 className="text-base sm:text-lg md:text-xl font-bold mb-2 sm:mb-3">
                    {question.question}
                  </h2>
                  <div className="bg-white/10 rounded-lg p-2 sm:p-3 border border-white/20">
                    <div className="text-xl sm:text-2xl mb-2 text-center">🎵</div>
                    <audio controls className="w-full">
                      <source src={question.mediaUrl} type="audio/mpeg" />
                    </audio>
                  </div>
                </div>
              )}
              {question.type === "video" && (
                <div>
                  <h2 className="text-base sm:text-lg md:text-xl font-bold mb-2 sm:mb-3">
                    {question.question}
                  </h2>
                  <video
                    controls
                    className="max-h-32 sm:max-h-40 mx-auto rounded-lg shadow-xl border-2 border-white/20"
                  >
                    <source src={question.mediaUrl} type="video/mp4" />
                  </video>
                </div>
              )}
            </div>

            {/* OPTIONS */}
            <div className="flex-1 grid grid-cols-1 gap-2 sm:gap-3 min-h-0">
              {question.options.map((opt, i) => {
                const isEliminated = eliminatedOptions.includes(i);
                const isSelected = selected === i;
                const isCorrect = correctAnswer === i;
                const isWrong =
                  answerSubmitted && isSelected && correctAnswer !== i;
                const showCorrect = answerSubmitted && correctAnswer === i;
                const isDisabled = isAdmin || isEliminated || answerSubmitted;

                return (
                  <button
                    key={i}
                    onClick={() => handleSubmit(i)}
                    disabled={isDisabled}
                    className={`group relative p-3 sm:p-4 rounded-xl border-2 text-left transition-all duration-300 transform min-h-0 ${
                      isEliminated
                        ? "bg-red-900/20 border-red-500/50 text-red-300 line-through cursor-not-allowed opacity-50"
                        : isWrong
                        ? "bg-gradient-to-r from-red-500/30 to-red-600/30 border-red-400"
                        : showCorrect
                        ? "bg-gradient-to-r from-green-500/30 to-emerald-500/30 border-green-400"
                        : isSelected && !answerSubmitted
                        ? "bg-gradient-to-r from-blue-500/30 to-blue-600/30 border-blue-400"
                        : "bg-white/10 border-white/20 hover:border-blue-400/50 hover:bg-blue-500/10"
                    }`}
                  >
                    <div className="flex items-center space-x-2 sm:space-x-3">
                      <div
                        className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center font-bold text-xs sm:text-sm ${
                          isEliminated
                            ? "bg-red-500/30 text-red-300"
                            : isWrong
                            ? "bg-red-500 text-white"
                            : showCorrect
                            ? "bg-green-500 text-white"
                            : isSelected && !answerSubmitted
                            ? "bg-blue-500 text-white"
                            : "bg-white/20 text-white"
                        }`}
                      >
                        {isEliminated
                          ? "❌"
                          : isWrong
                          ? "✗"
                          : showCorrect
                          ? "✓"
                          : isSelected && !answerSubmitted
                          ? "?"
                          : String.fromCharCode(65 + i)}
                      </div>
                      <span className="font-medium flex-1 text-sm sm:text-base">
                        {opt}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* ADMIN NEXT */}
            {isAdmin && (
              <div className="mt-2 sm:mt-3">
                <button
                  onClick={handleNext}
                  className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white font-bold py-2 sm:py-3 rounded-xl shadow-lg"
                >
                  ⏭️ Next Question
                </button>
              </div>
            )}
          </div>

          {/* SCOREBOARD */}
          <div className="w-full lg:w-80 bg-white/10 backdrop-blur-md rounded-xl p-3 sm:p-4 border border-white/20 flex flex-col order-1 lg:order-2">
            <div className="flex items-center space-x-2 mb-2 sm:mb-3">
              <span className="text-lg sm:text-xl">🏆</span>
              <h3 className="text-base sm:text-lg font-bold text-yellow-400">
                Live Leaderboard
              </h3>
            </div>

            <div className="flex-1 overflow-y-auto">
              {Object.entries(scores)
                .sort(([, a], [, b]) => b - a)
                .map(([id, score], index) => (
                  <div
                    key={id}
                    className={`flex justify-between items-center p-2 sm:p-3 rounded-lg ${
                      socket.id === id
                        ? "bg-gradient-to-r from-blue-500/30 to-purple-500/30 border border-blue-400/50"
                        : index === 0
                        ? "bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-400/30"
                        : "bg-white/5 border border-white/10"
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <div className="w-6 h-6 rounded-full flex items-center justify-center font-bold bg-blue-500 text-white">
                        {index + 1}
                      </div>
                      <span className="font-semibold text-sm">
                        {players[id] || "Unknown"}
                      </span>
                    </div>
                    <span className="font-bold text-green-400">{score}</span>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
