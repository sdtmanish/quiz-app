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
  const [answeredPlayers, setAnsweredPlayers] = useState({});
  const [eliminationRequests, setEliminationRequests] = useState({});
  const [eliminationsPerPlayer, setEliminationsPerPlayer] = useState(0);

  //palette for player-card borders
  const playerBorderClasses = [
    "border-yellow-400/50",
    "border-green-400",
    "border-blue-400",
    "border-pink-400/50",
    "border-indigo-400",
    "border-orange-400/50",
      "border-red-400/50",
  "border-teal-400/50",
  "border-purple-400/50",
  "border-lime-400/50"

  ]

  //small stable hash so a playerid always maps to the same color(prevents color suffling)
  const hashString = (str)=>{
    let h=0;
    for(let i=0;i<str.length;i++){
      h = (h<<5)-h + str.charCodeAt(i);
      h |=0;
    }
    return Math.abs(h);
  }

  const getBorderClassFor = (playerId, index)=>{
    const pick = playerId ? hashString(playerId) % playerBorderClasses.length : index % playerBorderClasses.length;
    return playerBorderClasses[pick];
  }

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
      setEliminationsPerPlayer(data.eliminationsPerPlayer);

      // Handle quiz restoration after admin refresh
      if (data.isQuizActive === true && data.currentQuestionIndex >= 0) {
        console.log("🔄 Restoring active quiz state:", data.currentQuestionIndex);
      }

      if (
        data.isQuizActive === false &&
        data.currentQuestionIndex >= (data.adminQuestionList?.length ?? 0) - 1
      ) {
        setQuizOver(true);
      }
    });

    socket.on("score_update", (updatedScores) => setScores(updatedScores));
    socket.on("quiz_ended", () =>{
      setQuizOver(true),
      handleExit();
    });
    socket.on("room_not_found", () => {
      alert("Room not found");
      router.push("/");
    });

    socket.on("admin_exists", () => {
      alert("Another admin is already controlling this room");
      router.push("/admin-dashboard/create-room");
    });

    socket.on("option_eliminated", ({ optionIndex, targetPlayerId }) => {
      setAdminEliminatedOptions((prev) => {
        const current = prev[targetPlayerId] || [];
        return current.includes(optionIndex)
          ? prev
          : { ...prev, [targetPlayerId]: [...current, optionIndex] };
      });
    });

    socket.on("option_restored", ({ optionIndex, targetPlayerId }) => {
      setAdminEliminatedOptions((prev) => {
        const current = prev[targetPlayerId] || [];
        const filtered = current.filter((idx) => idx !== optionIndex);
        return { ...prev, [targetPlayerId]: filtered };
      });
    });

    socket.on("player_answered", ({ playerId }) => {
      setAnsweredPlayers((prev) => ({ ...prev, [playerId]: true }));
    });

    socket.on("elimination_requested", ({ playerId, used, allowed }) => {
      setEliminationRequests((prev) => ({
        ...prev,
        [playerId]: {
          requested: true,
          used,
          allowed,
        },
      }));
    });

    socket.on("show_question", ({ eliminationsUsed, eliminationsPerPlayer }) => {
  setAdminEliminatedOptions({});
  setAnsweredPlayers({});

  // Preserve used/allowed counts while resetting request state
  setEliminationRequests((prev) => {
    const updated = {};
    for (const id in prev) {
      updated[id] = {
        ...prev[id],
        requested: false, // reset request flag
        used: eliminationsUsed?.[id] ?? prev[id]?.used ?? 0,
        allowed: eliminationsPerPlayer ?? prev[id]?.allowed ?? 0,
      };
    }
    return updated;
  });
});


    return () => {
      socket.off("game_state");
      socket.off("score_update");
      socket.off("quiz_ended");
      socket.off("room_not_found");
      socket.off("admin_exists");
      socket.off("option_eliminated");
      socket.off("option_restored");
      socket.off("show_question");
      socket.off("player_answered");
      socket.off("elimination_requested");
    };
  }, [roomId, adminName, router]);

  const handleNext = () => {
    socket.emit("next_question", { roomId });
    setAdminEliminatedOptions({});
    setAnsweredPlayers({});
    setEliminationRequests((prev) => {
      const updated = {};
      for (const id in prev) {
        updated[id] = { ...prev[id], requested: false };
      }
      return updated;
    });
  };

  const handleExit = () => {
    socket.emit("admin_exit", { roomId });
    socket.disconnect();
    router.push("/admin-dashboard/create-room");
  };

  const handleEliminateOption = (playerId, optionIndex) => {
    const isCurrentlyEliminated = adminEliminatedOptions[playerId]?.includes(optionIndex);

    if (isCurrentlyEliminated) {
      socket.emit("restore_option", { roomId, targetPlayerId: playerId, optionIndex });
      setAdminEliminatedOptions((prev) => {
        const current = prev[playerId] || [];
        const filtered = current.filter((idx) => idx !== optionIndex);
        return { ...prev, [playerId]: filtered };
      });
    } else {
      socket.emit("eliminate_option", { roomId, targetPlayerId: playerId, optionIndex });
      setAdminEliminatedOptions((prev) => {
        const current = prev[playerId] || [];
        return { ...prev, [playerId]: [...current, optionIndex] };
      });
    }
  };

  const handleEliminateOneWrong = (playerId) => {
    socket.emit("eliminate_one_wrong", { roomId, targetPlayerId: playerId });
  };

  const handleEliminateTwoWrong = (playerId) => {
    socket.emit("eliminate_two_wrong", { roomId, targetPlayerId: playerId });
  };

  const renderQuestionContent = (q) => {
    if (!q) return <p className="text-gray-400">Waiting for a question...</p>;

    switch (q.type) {
      case "image":
        return (
          <div>
            <p className="font-semibold mb-2">{q.question}</p>
            {q.mediaUrl && (
              <img
                src={q.mediaUrl}
                alt="Question media"
                className="max-h-22 rounded-lg shadow-lg"
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
              <video controls className="max-h-22 w-full rounded-lg shadow-lg">
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

  if (quizOver) {
    const sortedScores = Object.entries(scores).sort((a, b) => b[1] - a[1]);
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 text-white p-8 flex flex-col items-center">
        <div className="max-w-4xl w-full">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-yellow-500 rounded-full mb-4 animate-bounce">
              <span className="text-4xl">🏆</span>
            </div>
            <h2 className="text-4xl font-bold mb-4 bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
              Quiz Complete!
            </h2>
            <p className="text-xl text-gray-300">
              Room ID: <span className="font-mono font-bold text-blue-400">{roomId}</span>
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 shadow-2xl border border-white/20">
            <h3 className="text-2xl font-bold mb-6 text-center text-yellow-300">Final Leaderboard</h3>
            {sortedScores.length === 0 ? (
              <div className="text-center text-gray-400 py-8">
                <span className="text-6xl mb-4 block">😴</span>
                <p className="text-lg">No players participated in this quiz.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {sortedScores.map(([id, score], index) => (
                  <div
                    key={id}
                    className={`flex items-center justify-between p-4 rounded-xl transition-all duration-300 ${
                      index === 0
                        ? "bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border-2 border-yellow-400/50"
                        : index === 1
                        ? "bg-gradient-to-r from-gray-400/20 to-gray-500/20 border-2 border-gray-400/50"
                        : index === 2
                        ? "bg-gradient-to-r from-orange-600/20 to-red-600/20 border-2 border-orange-400/50"
                        : "bg-white/5 border border-white/10"
                    }`}
                  >
                    <div className="flex items-center space-x-4">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                          index === 0
                            ? "bg-yellow-500 text-black"
                            : index === 1
                            ? "bg-gray-400 text-black"
                            : index === 2
                            ? "bg-orange-600 text-white"
                            : "bg-blue-600 text-white"
                        }`}
                      >
                        {index + 1}
                      </div>
                      <span className="text-lg font-semibold">
                        {players[id] || "Unknown Player"}
                      </span>
                      {index === 0 && <span className="text-2xl">👑</span>}
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-2xl font-bold text-green-400">{score}</span>
                      <span className="text-sm text-gray-400">pts</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="text-center mt-8">
            <button
              onClick={handleExit}
              className="bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white font-bold py-4 px-8 rounded-full transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
            >
              <span className="mr-2">🚪</span>
              Exit Quiz Room
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 text-white overflow-hidden">
      <audio src="/assets/Unforgettable.mp3" autoPlay loop></audio>
      <div className="h-screen flex flex-col p-4">
        <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 mb-4 border border-white/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                Quiz Dashboard
              </h1>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-xs text-gray-300">Live</span>
              </div>
              <div className="bg-blue-500/20 px-4 py-1 rounded-full border border-blue-400/30">
                <span className="text-xl font-mono">Cohort ID: {roomId}</span>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-200">Q.{currentIndex + 1}</div>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={handleNext}
                  className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 cursor-pointer active:scale-95 text-white font-bold py-2 px-4 rounded-lg shadow-lg transition-all duration-300 transform hover:scale-105 text-sm"
                >
                  ⏭️ Next
                </button>
                <button
                  onClick={handleExit}
                  className="bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 cursor-pointer active:scale-95 text-white font-bold py-2 px-4 rounded-lg shadow-lg transition-all duration-300 transform hover:scale-105 text-sm"
                >
                  🚪 Exit
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 flex gap-4 min-h-0">
          <div className="w-72 bg-white/10 backdrop-blur-md rounded-xl p-4 px-2 border border-white/20 flex flex-col">
            <div className="flex items-center space-x-2 mb-3">
              <span className="text-xl">🏆</span>
              <h2 className="text-lg font-bold text-yellow-400">Live Leaderboard</h2>
            </div>

            {Object.keys(scores).length === 0 ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <span className="text-3xl mb-2 block">⏳</span>
                  <p className="text-gray-400 text-sm">Waiting for responses...</p>
                </div>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto space-y-2">
                {Object.entries(scores)
                  .sort(([, a], [, b]) => b - a)
                  .map(([id, score], index) => (
                    <div
                      key={id}
                      className={`flex justify-between items-center p-3 rounded-lg transition-all duration-300 ${
                        index === 0
                          ? "bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-400/30"
                          : "bg-white/5 border border-white/10"
                      }`}
                    >
                      <div className="flex items-center space-x-2 min-w-0">
                        <div
                          className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                            index === 0
                              ? "bg-yellow-500 text-black"
                              : "bg-blue-500 text-white"
                          }`}
                        >
                          {index + 1}
                        </div>
                        <span className="font-semibold text-sm truncate">
                          {players[id] || "Unknown"}
                        </span>
                        {index === 0 && <span className="text-sm">👑</span>}
                      </div>
                      <div className="flex items-center space-x-1">
                        <span className="font-bold text-green-400">{score}</span>
                        <span className="text-xs text-gray-400">pts</span>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>

          <div className="flex-1  min-w-0 ">
            <div className="h-full overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-x-3 gap-y-0">
              {Object.keys(players).map((id, index) => {
                const currentQ = questions[id];
                return (
                  <div
                    key={id}
                    className={`bg-white/10 backdrop-blur-md rounded-xl p-4 border ${getBorderClassFor(id,index)}
           h-40 sm:h-48 md:h-56 lg:h-80 xl:h-72 2xl:h-56`}

                  >
                    <div className="flex flex-wrap items-center justify-between mb-3 gap-2">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                          {players[id]?.charAt(0)?.toUpperCase() || "?"}
                        </div>
                        <div>
                          <h3 className="font-bold text-blue-300">{players[id]}</h3>
                          <div className="flex items-center space-x-2 text-xs text-gray-400">
                            <span>Score: {scores[id] || 0}</span>
                            <span>•</span>
                            <span>Player {index + 1}</span>
                          </div>
                        </div>
                      </div>
                      <button
                        className={`px-3 py-2 rounded-lg text-sm font-semibold border shadow-sm transition-all duration-300 transform cursor-pointer
                          ${
                            eliminationRequests[id]?.requested
                              ? "bg-red-500/50 border-red-400 text-white hover:bg-red-600 hover:shadow-md hover:scale-105"
                              : "bg-green-600/30 border-green-400 text-white hover:bg-green-700 hover:shadow-md hover:scale-105"
                          }`}
                      >
                        ⚡ Elimination Req:{" "}
                        {eliminationRequests[id]?.used || 0}/
                        {eliminationRequests[id]?.allowed || eliminationsPerPlayer}
                      </button>

                      {answeredPlayers[id] ? (
                        <div className="bg-green-500/20 px-3 py-1 rounded-full border border-green-400 cursor-pointer">
                          <span className="text-xs text-green-400 font-medium">Answered</span>
                        </div>
                      ) : (
                        <div className="bg-red-500/20 px-3 py-1 rounded-full border border-red-400/30 cursor-pointer">
                          <span className="text-xs text-red-400 font-medium">Pending</span>
                        </div>
                      )}

                      <div
                        onClick={() =>
                          eliminationRequests[id]?.requested &&
                          eliminationRequests[id].used <= eliminationRequests[id].allowed &&
                          handleEliminateOneWrong(id)
                        }
                        className={`px-3 py-2 rounded-full text-xs border transition
                          ${
                            eliminationRequests[id]?.requested
                              ? "bg-green-600/30 border-green-400 text-green-400 hover:bg-green-700 hover:shadow-md hover:scale-105 cursor-pointer"
                              : "bg-red-500/20 text-red-400 border-gray-500 cursor-not-allowed"
                          }`}
                      >
                        Remove 1 wrong
                      </div>

                      <div
                        onClick={() =>
                          eliminationRequests[id]?.requested &&
                          eliminationRequests[id].used <= eliminationRequests[id].allowed &&
                          handleEliminateTwoWrong(id)
                        }
                        className={`px-3 py-2 rounded-full text-xs border transition
                          ${
                            eliminationRequests[id]?.requested
                              ? "bg-green-600/30 border-green-400 text-green-400 hover:bg-green-700 hover:shadow-md hover:scale-105 cursor-pointer"
                              : "bg-red-500/20 text-red-400 border-gray-500 cursor-not-allowed"
                          }`}
                      >
                        Eliminate 50:50
                      </div>
                    </div>

                    <div className="grid lg:grid-cols-2 gap-4">
                      <div className="bg-white/5 rounded-lg p-3">
                        <div className="text-sm">{renderQuestionContent(currentQ)}</div>

                        {currentQ?.answer && (
                          <div className="mt-2 bg-green-500/10 border border-green-400/30 rounded p-2">
                            <div className="flex items-center space-x-1">
                              <span className="text-green-400 text-xs">✅</span>
                              <span className="text-xs font-medium text-green-300">
                                Correct: {currentQ.answer}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>

                      {currentQ?.options && (
                        <div>
                          <div className="flex items-center space-x-2 mb-2">
                            <span className="text-xs font-medium text-orange-400">
                              ⚡ Power Controls:
                            </span>
                            <span className="text-xs text-gray-400">
                              Click to eliminate/restore
                            </span>
                          </div>
                          <div className="grid grid-cols-2 gap-1">
                            {currentQ.options.map((opt, i) => {
                              const eliminated = adminEliminatedOptions[id]?.includes(i);
                              return (
                                <button
                                  key={i}
                                  onClick={() => handleEliminateOption(id, i)}
                                  className={`p-2 rounded text-xs font-medium transition-all duration-300 transform hover:scale-105 ${
                                    eliminated
                                      ? "bg-red-900/50 border border-red-500/50 text-red-200 hover:bg-red-800/60"
                                      : "bg-orange-600/20 hover:bg-orange-600/40 border border-orange-500/30 text-orange-200 hover:text-white"
                                  }`}
                                >
                                  <span className="mr-1">{eliminated ? "🔄" : "⚡"}</span>
                                  {eliminated ? "Restore" : "Eliminate"} {i + 1}
                                  <div className="text-xs mt-1 opacity-75 truncate">
                                    {opt.length > 15 ? opt.substring(0, 15) + "..." : opt}
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
