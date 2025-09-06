"use client";
import React, { useState, useEffect } from "react";
import { io } from "socket.io-client";

// This is a placeholder for your questions data, which would typically be
// shared between the admin and player clients. For this single-file
// example, we will define it here.
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

const QuizPlayer = () => {
  const [socket, setSocket] = useState(null);
  const [roomId, setRoomId] = useState("");
  const [playerName, setPlayerName] = useState("");
  const [players, setPlayers] = useState({});
  const [scores, setScores] = useState({});
  const [currentQIndex, setCurrentQIndex] = useState(null);
  const [hasAnswered, setHasAnswered] = useState(false);
  const [isQuizEnded, setIsQuizEnded] = useState(false);
  const [isConnected, setIsConnected] = useState(false);

  // Initialize socket connection and event listeners
  useEffect(() => {
    const newSocket = io("https://quizhubapi.onrender.com", {
      transports: ["websocket"],
    });

    newSocket.on("connect", () => {
      setIsConnected(true);
      console.log("Connected to server:", newSocket.id);
    });

    newSocket.on("connect_error", (err) => {
      console.error("Connection error:", err);
      setIsConnected(false);
    });

    newSocket.on("game_state", (data) => {
      setPlayers(data.players);
      setScores(data.scores);
    });
    
    newSocket.on("show_question", ({ question, index }) => {
        // Find the question by its index from the local array
        const foundQuestion = questions[index];
        if (foundQuestion) {
            setHasAnswered(false);
            setCurrentQIndex(index);
        }
    });

    newSocket.on("score_update", (updatedScores) => {
      setScores(updatedScores);
    });

    newSocket.on("quiz_ended", (finalScores) => {
      setScores(finalScores);
      setIsQuizEnded(true);
    });
    
    setSocket(newSocket);

    // Clean up on component unmount
    return () => newSocket.disconnect();
  }, []);

  // Effect to handle joining the room once connected and details are entered
  useEffect(() => {
    if (socket && isConnected && roomId && playerName) {
      socket.emit("join_game", { roomId, playerName, isAdmin: false });
    }
  }, [socket, isConnected, roomId, playerName]);

  const handleSubmitAnswer = (answer) => {
    if (socket && !hasAnswered) {
      socket.emit("submit_answer", { roomId, answer });
      setHasAnswered(true);
    }
  };

  const currentQuestion = currentQIndex !== null ? questions[currentQIndex] : null;

  const renderContent = () => {
    if (!roomId || !playerName) {
      return (
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-bold text-gray-800">Join a Quiz</h2>
          <input
            className="w-full px-4 py-2 rounded-lg border focus:ring focus:ring-blue-300 outline-none"
            placeholder="Enter Room ID"
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
          />
          <input
            className="w-full px-4 py-2 rounded-lg border focus:ring focus:ring-blue-300 outline-none"
            placeholder="Enter Your Name"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
          />
        </div>
      );
    }

    if (isQuizEnded) {
      return (
        <div className="text-center space-y-4">
          <h2 className="text-3xl font-bold text-indigo-700">Quiz Ended!</h2>
          <p className="text-xl font-semibold text-gray-700">Final Scores:</p>
          <ul className="space-y-2">
            {Object.entries(scores).map(([id, score]) => (
              <li key={id} className="flex justify-between items-center bg-gray-50 p-4 rounded-xl shadow-sm">
                <span className="font-medium text-gray-800">{players[id] || "Unknown Player"}</span>
                <span className="font-bold text-indigo-600">{score} pts</span>
              </li>
            ))}
          </ul>
        </div>
      );
    }

    if (currentQuestion === null) {
      return (
        <div className="text-center space-y-4">
          <h2 className="text-3xl font-bold text-indigo-700">Joined Room: {roomId}</h2>
          <p className="text-lg text-gray-600">Waiting for the admin to start the quiz...</p>
          <div className="bg-gray-100 rounded-xl p-4 mt-6">
            <h3 className="text-xl font-semibold text-gray-700 mb-3">Players in Room</h3>
            <ul className="space-y-2">
              {Object.entries(players).map(([id, name]) => (
                <li key={id} className="bg-white px-4 py-2 rounded-lg shadow-sm font-medium text-gray-800">
                  {name}
                </li>
              ))}
            </ul>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <div className="bg-gray-100 rounded-xl p-6">
          <p className="text-lg font-semibold text-indigo-700 mb-2">
            Question {currentQIndex + 1} of {questions.length}
          </p>
          <p className="text-2xl font-bold text-gray-800">{currentQuestion.questionText}</p>
        </div>
        <div className="space-y-3">
          {currentQuestion.options.map((option, index) => (
            <button
              key={index}
              onClick={() => handleSubmitAnswer(option)}
              disabled={hasAnswered}
              className="w-full text-left bg-white border border-gray-200 hover:border-blue-500 rounded-lg p-4 font-semibold text-gray-800 transition shadow-sm
                disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {option}
            </button>
          ))}
        </div>
        {hasAnswered && (
          <div className="text-center p-4 bg-green-100 text-green-700 rounded-lg">
            <p className="font-bold">Answer submitted! Waiting for the next question.</p>
          </div>
        )}
        <div className="bg-gray-100 rounded-xl p-4">
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Live Scores</h3>
          <ul className="space-y-2">
            {Object.entries(scores)
              .sort(([, scoreA], [, scoreB]) => scoreB - scoreA) // Sort players by score
              .map(([id, score]) => (
                <li
                  key={id}
                  className="flex justify-between items-center bg-white px-4 py-2 rounded-lg shadow-sm"
                >
                  <span className="font-medium text-gray-800">{players[id] || "Unknown Player"}</span>
                  <span className="font-bold text-indigo-600">{score} pts</span>
                </li>
              ))}
          </ul>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center p-6">
      <div className="w-full max-w-3xl bg-white rounded-2xl shadow-xl p-8 space-y-6">
        <h1 className="text-3xl font-bold text-center text-indigo-600">
          🚀 Quiz Player Panel
        </h1>
        {renderContent()}
      </div>
    </div>
  );
};

export default PlayerInterface;
