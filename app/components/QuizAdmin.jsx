"use client";
import { useState, useEffect } from "react";
import { io } from "socket.io-client";

const questions = [
  {
    questionText: "What is the capital of France?",
    options: ["Berlin", "Madrid", "Paris", "Rome"],
    correctAnswer: "Paris",
  },
  {
    questionText: "Who painted the Mona Lisa?",
    options: ["Vincent van Gogh", "Pablo Picasso", "Leonardo da Vinci", "Claude Monet"],
    correctAnswer: "Leonardo da Vinci",
  },
  {
    questionText: "What is the largest planet in our solar system?",
    options: ["Earth", "Jupiter", "Saturn", "Mars"],
    correctAnswer: "Jupiter",
  },
];

export default function QuizAdmin() {
  const [roomId, setRoomId] = useState("room1");
  const [playerName] = useState("Admin");
  const [players, setPlayers] = useState({});
  const [scores, setScores] = useState({});
  const [currentQ, setCurrentQ] = useState(null);
  const [socket, setSocket] = useState(null);

  // Initialize socket connection
  useEffect(() => {
    const newSocket = io("https://quizhubapi.onrender.com", {
      transports: ["websocket"],
    });
    setSocket(newSocket);

    newSocket.on("connect", () => {
      console.log("Connected to server:", newSocket.id);
      // Join the room after connecting
      newSocket.emit("join_game", { roomId, playerName, isAdmin: true });
    });

    newSocket.on("connect_error", (err) => {
      console.error("Connection error:", err);
    });

    newSocket.on("game_state", (data) => {
      setPlayers(data.players);
      setScores(data.scores);
      setCurrentQ(data.currentQ);
    });

    newSocket.on("show_question", ({ question, index }) => {
      setCurrentQ(index);
      console.log("Question:", question);
    });

    newSocket.on("score_update", (scores) => setScores(scores));

    return () => {
      newSocket.disconnect();
    };
  }, [playerName]);

  // Rejoin room when roomId changes
  useEffect(() => {
    if (socket && socket.connected) {
      socket.emit("join_game", { roomId, playerName, isAdmin: true });
    }
  }, [roomId, socket, playerName]);

  const startQuiz = () => {
    if (!socket) return;
    console.log("Starting quiz...");
    socket.emit("start_quiz", { roomId, questions });
  };

  const nextQuestion = () => {
    if (!socket) return;
    console.log("Next question...");
    socket.emit("next_question", { roomId });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center p-6">
      <div className="w-full max-w-3xl bg-white rounded-2xl shadow-xl p-8 space-y-6">
        {/* Header */}
        <h2 className="text-2xl font-bold text-center text-indigo-600">
          🎮 Quiz Admin Panel
        </h2>

        {/* Room Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-2">
            <label className="text-gray-700 font-medium">Room ID:</label>
            <input
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
              className="px-3 py-2 border rounded-lg focus:ring focus:ring-indigo-300 outline-none"
            />
          </div>

          <div className="flex gap-3">
            <button
              onClick={startQuiz}
              className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg font-semibold shadow-md transition"
            >
              🚀 Start Quiz
            </button>
            <button
              onClick={nextQuestion}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold shadow-md transition"
            >
              ➡️ Next Question
            </button>
          </div>
        </div>

        {/* Players */}
        <div className="bg-gray-100 rounded-xl p-4">
          <h3 className="text-lg font-semibold text-gray-700 mb-3">Players</h3>
          {Object.keys(players).length === 0 ? (
            <p className="text-gray-500 italic">No players joined yet...</p>
          ) : (
            <ul className="space-y-2">
              {Object.entries(players).map(([id, name]) => (
                <li
                  key={id}
                  className="flex justify-between bg-white px-4 py-2 rounded-lg shadow-sm"
                >
                  <span className="font-medium text-gray-800">{name}</span>
                  <span className="text-indigo-600 font-bold">
                    {scores[id] || 0} pts
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Current Question */}
        {currentQ !== null && (
          <div className="text-center mt-4">
            <p className="text-gray-600">
              📌 Current Question:{" "}
              <span className="font-bold text-indigo-700">{currentQ + 1}</span>
              /{questions.length}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
