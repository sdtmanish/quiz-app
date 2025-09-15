"use client";

import { useEffect, useState } from "react";
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

  const router = useRouter();

  useEffect(() => {
    // Check for game state before doing anything
    if (!roomId || !effectiveName) {
      router.push("/");
      return;
    }

    // Connect socket if not already connected
    if (!socket.connected) socket.connect();

    // Join the game on the server
    socket.emit("join_game", {
      roomId,
      playerName: effectiveName,
      isAdmin: !!adminName,
    });

    // Set up all socket event listeners
    socket.on("game_state", (data) => {
      setScores(data.scores || {});
      setPlayers(data.players || {});
      setJoined(true);
      setAdminId(data.adminId);
      
      const isCurrentUserAdmin = socket.id === data.adminId;
      setIsAdmin(isCurrentUserAdmin);
      setLoading(false);

      if (isCurrentUserAdmin && data.questions && data.questions[socket.id]) {
        setQuestion(data.questions[socket.id]);
        setCurrentIndex(data.currentQuestionIndex);
      }
    });

    socket.on("show_question", ({ question, index }) => {
      setQuizEnded(false);
      setQuestion(question);
      setCurrentIndex(index);
      setSelected(null);
      setEliminatedOptions([]);
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
      setEliminatedOptions(prev => [...prev, optionIndex]);
    });

    // Cleanup function to prevent memory leaks and duplicate listeners
    return () => {
      socket.disconnect();
      socket.off("game_state");
      socket.off("show_question");
      socket.off("score_update");
      socket.off("quiz_ended");
      socket.off("no_questions_found");
      socket.off("room_not_found");
      socket.off("option_eliminated");
    };
  }, [roomId, effectiveName, adminName, router]); // `isAdmin` has been removed.

  const handleSubmit = (answerIndex) => {
    if (!isAdmin) {
      setSelected(answerIndex);
      socket.emit("submit_answer", { roomId, answer: answerIndex });
    }
  };

  const handleNext = () => {
    if (isAdmin) {
      socket.emit("next_question", { roomId });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white bg-gray-900">
        Joining room...
      </div>
    );
  }

  if (quizEnded) {
    return (
      <FinalScores scores={scores} players={players} onRestart={() => router.push("/")} />
    );
  }

  if (!question) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white bg-gray-900">
        Waiting for the admin to start the quiz...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8 flex flex-col items-center">
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

      <div className="flex flex-col gap-4 w-full max-w-lg">
        {question.options.map((opt, i) => {
          const isEliminated = eliminatedOptions.includes(i);
          const isDisabled = isAdmin || isEliminated || selected !== null;
          const buttonClass = `p-3 rounded-lg border text-left transition ${
            isEliminated
              ? "bg-gray-700 text-gray-500 line-through cursor-not-allowed border-gray-600"
              : selected === i
              ? "bg-green-600 border-green-600"
              : "bg-gray-800 hover:bg-gray-700 border-gray-600"
          }`;
          return (
            <button
              key={i}
              onClick={() => handleSubmit(i)}
              className={buttonClass}
              disabled={isDisabled}
            >
              {opt}
            </button>
          );
        })}
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