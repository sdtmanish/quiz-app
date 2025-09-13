'use client';
import { useEffect, useState } from "react";
import { socket } from "../lib/socket";
import { useRouter } from "next/navigation";
import { useGame } from "../context/GameContext";

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
  const [quizOver, setQuizOver] = useState(false);

  const router = useRouter();

  useEffect(() => {
    console.log("🚀 QuizPage mounted", { roomId, effectiveName });

    if (!roomId || !effectiveName) {
      router.push("/");
      return;
    }

    if (!socket.connected) socket.connect();

    console.log("📡 Joining room...");
    socket.emit("join_game", {
      roomId,
      playerName: effectiveName,
      isAdmin: !!adminName,   // ✅ fix: mark admin properly
    });

    socket.on("game_state", (data) => {
      console.log("📝 Received game_state:", data);
      setScores(data.scores || {});
      setPlayers(data.players || {});
      setJoined(true);
      setAdminId(data.adminId);
      setIsAdmin(socket.id === data.adminId);

      if (data.currentQ !== undefined && data.questions?.length > 0) {
        const currentQIndex = data.currentQ;
        setQuestion(data.questions[currentQIndex]);
        setCurrentIndex(currentQIndex);
      }
    });

    socket.on("show_question", ({ question, index }) => {
      console.log("❓ Received show_question:", question, "Index:", index);
      setQuestion(question);
      setCurrentIndex(index);
      setSelected(null);
    });

    socket.on("score_update", (updatedScores) => {
      console.log("🏆 Score update:", updatedScores);
      setScores(updatedScores);
    });

    socket.on("quiz_ended", () => {
      console.log("🏁 Quiz ended");
      setQuizOver(true); // ✅ show scoreboard instead of redirect
    });

    socket.on("no_questions_found", () => {
      console.log("⚠️ No questions found");
      alert("No questions found in the database.");
      router.push(isAdmin ? "/admin-dashboard/admin-lobby" : "/");
    });

    socket.on("room_not_found", () => {
      console.log("❌ Room not found");
      alert("Room not found. Please check the room ID.");
      router.push("/");
    });

    return () => {
      console.log("🧹 Cleaning up socket listeners");
      socket.off("game_state");
      socket.off("show_question");
      socket.off("score_update");
      socket.off("quiz_ended");
      socket.off("no_questions_found");
      socket.off("room_not_found");
    };
  }, [roomId, effectiveName, adminName, router]);

  const handleSubmit = (answerIndex) => {
    if (!isAdmin) {
      console.log("✏️ Submitting answer:", answerIndex);
      setSelected(answerIndex);
      socket.emit("submit_answer", { roomId, answer: answerIndex });
    }
  };

  const handleNext = () => {
    if (isAdmin) {
      console.log("➡️ Admin requesting next question");
      socket.emit("next_question", { roomId });
    }
  };

  // ✅ Scoreboard when quiz ends
  if (quizOver) {
    const sortedScores = Object.entries(scores).sort((a, b) => b[1] - a[1]);

    return (
      <div className="min-h-screen bg-gray-900 text-white p-8 flex flex-col items-center">
        <h2 className="text-3xl font-bold mb-6">🏆 Final Scores</h2>
        <div className="w-full max-w-md bg-gray-800 rounded-lg p-6 shadow-lg">
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
        <button
          onClick={() => router.push("/")}
          className="mt-6 bg-green-600 hover:bg-green-700 py-3 px-6 rounded-lg font-bold"
        >
          Exit
        </button>
      </div>
    );
  }

  if (!joined) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white bg-gray-900">
        Joining room...
      </div>
    );
  }

  if (!question) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white bg-gray-900">
        Loading question...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8 flex flex-col items-center">
      {/* ✅ Render question depending on type */}
      <div className="mb-6 text-center">
        {question.type === "text" && (
          <h2 className="text-3xl font-bold">{question.question}</h2>
        )}

        {question.type === "image" && (
          <div>
            <h2 className="text-xl font-semibold mb-4">{question.question}</h2>
            <img
              src={question.mediaUrl}
              alt="Question Media"
              className="max-h-64 mx-auto rounded-lg shadow-lg"
            />
          </div>
        )}

        {question.type === "audio" && (
          <div>
            <h2 className="text-xl font-semibold mb-4">{question.question}</h2>
            <audio controls className="mx-auto">
              <source src={question.mediaUrl} type="audio/mpeg" />
              Your browser does not support audio.
            </audio>
          </div>
        )}

        {question.type === "video" && (
          <div>
            <h2 className="text-xl font-semibold mb-4">{question.question}</h2>
            <video controls className="mx-auto max-h-80 rounded-lg shadow-lg">
              <source src={question.mediaUrl} type="video/mp4" />
              Your browser does not support video.
            </video>
          </div>
        )}
      </div>

      {/* ✅ Options */}
      <div className="flex flex-col gap-4 w-full max-w-lg">
        {question.options.map((opt, i) => (
          <button
            key={i}
            onClick={() => handleSubmit(i)}
            className={`p-3 rounded-lg border border-gray-600 text-left transition ${
              selected === i ? "bg-green-600" : "bg-gray-800 hover:bg-gray-700"
            }`}
            disabled={isAdmin}
          >
            {opt}
          </button>
        ))}
      </div>

      {isAdmin && (
        <button
          onClick={handleNext}
          className="mt-6 bg-green-600 hover:bg-green-700 py-3 px-6 rounded-lg font-bold"
        >
          Next Question
        </button>
      )}
    </div>
  );
}
