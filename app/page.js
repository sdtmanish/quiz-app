"use client";
import { useState, useEffect } from "react";
import QRCode from "react-qr-code";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
// Hardcoded quiz questions for the game
const QUIZ_QUESTIONS = [
  {
    question: "What is the capital of France?",
    type: "text", // Add type field
    options: ["Berlin", "Madrid", "Paris", "Rome"],
    correctAnswer: "Paris",
  },
  {
    question: "Which planet is known as the 'Red Planet'?",
    type: "text",
    options: ["Mars", "Jupiter", "Venus", "Saturn"],
    correctAnswer: "Mars",
  },
  {
    question: "What is the largest ocean on Earth?",
    type: "text",
    options: [
      "Atlantic Ocean",
      "Indian Ocean",
      "Arctic Ocean",
      "Pacific Ocean",
    ],
    correctAnswer: "Pacific Ocean",
  },
  // New question with an image
  {
    question: "What famous landmark is this?",
    type: "image",
    media: {
      type: "image",
      url:"/assets/mona.jpg",
    },
    options: ["Statue of Liberty", "Eiffel Tower", "Tower Bridge", "Colosseum"],
    correctAnswer: "Eiffel Tower",
  },
  // New question with an audio file
  {
    question: "Listen to the sound and guess what it is.",
    type: "audio",
    media: {
      type: "audio",
      url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3", // Use a placeholder URL
    },
    options: ["Rain", "Birds Chirping", "Music", "A Car Horn"],
    correctAnswer: "Music",
  },
  // New question with a video
  {
    question: "Watch the video and identify the animal.",
    type: "video",
    media: {
      type: "video",
      url: "https://www.w3schools.com/html/mov_bbb.mp4", // Use a placeholder URL
    },
    options: ["Lion", "Bear", "Elephant", "Tiger"],
    correctAnswer: "Elephant",
  },
];

// This component is responsible for loading the external Socket.IO
// library and letting the parent know when it's ready.
const ScriptLoader = ({ onScriptLoaded }) => {
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://cdn.socket.io/4.7.4/socket.io.min.js";
    script.async = true;

    script.onload = () => {
      onScriptLoaded(true);
    };

    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, [onScriptLoaded]);

  return null; // This component doesn't render anything itself
};

// The top-level component that manages the "pages" of the application.
const App = () => {
  const [page, setPage] = useState("join");
  const [roomId, setRoomId] = useState("");
  const [playerName, setPlayerName] = useState("");
  const [socket, setSocket] = useState(null);
  const [isScriptLoaded, setIsScriptLoaded] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [scores, setScores] = useState({});
  const [isQuizActive, setIsQuizActive] = useState(false);
  const [quizEnded, setQuizEnded] = useState(false);
  const [players, setPlayers] = useState({});
  const [adminId, setAdminId] = useState(null); // Centralized adminId state
  const [adminName, setAdminName] = useState(null); // New state to hold the admin's name // This useEffect hook handles the socket connection and all real-time events. // It now only runs after the Socket.IO script has been loaded.

  useEffect(() => {
    if (page === "lobby" && isScriptLoaded && roomId && playerName) {
      if (window.io) {
        // Use a consistent URL for both local and production
        const URL = "https://quizhubapi.onrender.com"; // Change this to "http://localhost:3000" for local testing

        const newSocket = window.io(URL, {
          transports: ["websocket"],
        });
        setSocket(newSocket);
        newSocket.on("connect", () => {
          console.log("Socket connected:", newSocket.id); // Pass the player's name and room ID to the backend
          newSocket.emit("join_game", { roomId, playerName });
        });

        newSocket.on("game_state", (gameState) => {
          console.log("Received game state:", gameState);
          setScores(gameState.scores);
          setPlayers(gameState.players);
          setAdminId(gameState.adminId); // Set the centralized adminId
          setAdminName(gameState.adminName); // New line
        });

        newSocket.on("show_question", (data) => {
          console.log("Received show_question:", data);
          setCurrentQuestion(data.question);
          setCurrentQuestionIndex(data.index);
          setIsQuizActive(true);
          setQuizEnded(false);
        });

        newSocket.on("score_update", (updatedScores) => {
          setScores(updatedScores);
        });

        newSocket.on("quiz_ended", (finalScores) => {
          setScores(finalScores);
          setQuizEnded(true);
        }); // Disconnect the socket when leaving the lobby.
        return () => {
          if (newSocket) {
            newSocket.disconnect();
          }
        };
      } else {
        console.error(
          "Socket.IO library is not available, but should be loaded."
        );
      }
    }
  }, [page, isScriptLoaded, roomId, playerName]); // Renders the correct component based on the current page state.

  if (page === "join") {
    return (
      <>
                <ScriptLoader onScriptLoaded={setIsScriptLoaded} />       {" "}
        <JoinPage
          setPage={setPage}
          roomId={roomId}
          setRoomId={setRoomId}
          playerName={playerName}
          setPlayerName={setPlayerName}
        />
             {" "}
      </>
    );
  }

  if (isQuizActive && !quizEnded) {
    return (
      <>
                <ScriptLoader onScriptLoaded={setIsScriptLoaded} />       {" "}
        <QuizPage
          socket={socket}
          roomId={roomId}
          currentQuestion={currentQuestion}
          currentQuestionIndex={currentQuestionIndex}
          scores={scores}
          adminId={adminId} // Pass adminId down
        />
             {" "}
      </>
    );
  }

  if (quizEnded) {
    return (
      <>
                <ScriptLoader onScriptLoaded={setIsScriptLoaded} />       {" "}
        <ResultsPage
          scores={scores}
          players={players}
          setPage={setPage}
          setQuizEnded={setQuizEnded}
          adminId={adminId} // Pass adminId down to the results page
        />
             {" "}
      </>
    );
  }

  return (
    <>
            <ScriptLoader onScriptLoaded={setIsScriptLoaded} />     {" "}
      <LobbyPage
        socket={socket}
        roomId={roomId}
        playerName={playerName}
        setPage={setPage}
        players={players}
        adminId={adminId} // Pass adminId down
        adminName={adminName} // New prop
      />
         {" "}
    </>
  );
};

// Component for the "Join/Create Game" page.
const JoinPage = ({
  setPage,
  roomId,
  setRoomId,
  playerName,
  setPlayerName,
}) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleJoinOrCreate = () => {
    if (!roomId || !playerName) {
      console.error("Please enter a room ID and your name.");
      return;
    }
    setIsLoading(true);
    setPage("lobby");
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white font-sans">
           {" "}
      <div className="bg-gray-800 p-8 rounded-2xl shadow-lg border border-gray-700 w-full max-w-sm">
               {" "}
        <h1 className="text-3xl font-extrabold text-center mb-6 text-indigo-400">
          Join or Create Game
        </h1>
               {" "}
        <div className="space-y-4">
                   {" "}
          <input
            className="w-full bg-gray-700 text-white placeholder-gray-400 border border-gray-600 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all duration-200"
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
            placeholder="Room ID"
            // readOnly={!!roomId}
            // style={{
            //   cursor: roomId ? 'not-allowed' : 'text',
            //   backgroundColor: roomId ? '#4a5568' : '#4a5568'
            // }}
          />
                   {" "}
          <input
            className="w-full bg-gray-700 text-white placeholder-gray-400 border border-gray-600 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all duration-200"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            placeholder="Your Name"
          />
                 {" "}
        </div>
               {" "}
        <button
          onClick={handleJoinOrCreate}
          disabled={isLoading}
          className="mt-6 w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-bold py-3 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
        >
                    {isLoading ? "Connecting..." : "Join or Create Room"}       {" "}
        </button>
             {" "}
      </div>
         {" "}
    </div>
  );
};

// Component for the "Lobby" page.
const LobbyPage = ({
  socket,
  roomId,
  playerName,
  setPage,
  players,
  adminId,
  adminName,
}) => {
  const isThisUserAdmin = socket && adminId && socket.id === adminId;
  const [message, setMessage] = useState("Connecting to lobby...");

  useEffect(() => {
    if (socket) {
      setMessage(`Welcome to the lobby, ${playerName}!`);
    }
  }, [socket, playerName]);

  const startQuiz = () => {
    if (!isThisUserAdmin) {
      console.error("Only the admin can start the quiz.");
      return;
    }
    setMessage("Starting quiz...");
    socket.emit("start_quiz", { roomId, questions: QUIZ_QUESTIONS });
  };

  if (!socket) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-900 text-white">
        <p>{message}</p>
      </div>
    );
  }

  // ⭐ NEW: Generate the full URL for the QR code
  // Replace 'http://localhost:3000' with your deployed frontend URL
  const joinUrl = `https://quiz-app-pied-omega.vercel.app/`;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white font-sans p-4">
      <div className="bg-gray-800 p-8 rounded-2xl shadow-lg border border-gray-700 w-full max-w-lg space-y-6">
        <h1 className="text-3xl font-extrabold text-center text-indigo-400">
          Quiz Lobby
        </h1>
        <p className="text-center text-gray-300">
          Room ID:{" "}
          <span className="font-mono text-lg text-yellow-400">{roomId}</span>
        </p>

        {/* ⭐ NEW: QR Code section, only for the admin */}
        {isThisUserAdmin && (
          <div className="flex flex-col items-center p-4 bg-gray-700 rounded-lg shadow-inner border border-gray-600">
            <p className="text-lg font-semibold mb-3 text-white">
              Players can scan this QR code to join:
            </p>
            <div className="p-2 bg-white rounded-lg">
              <QRCode value={joinUrl} size={128} />
            </div>
          </div>
        )}

        <div className="space-y-4">
          <p className="text-center text-lg">
            {isThisUserAdmin ? (
              <span className="text-green-400 font-semibold">
                You are the admin.
              </span>
            ) : (
              <span className="text-gray-400">
                Waiting for the admin to start the quiz...
              </span>
            )}
          </p>

          <div className="bg-gray-700 p-4 rounded-lg shadow-inner border border-gray-600">
            <h2 className="text-xl font-bold mb-2 text-center text-white">
              Players ({Object.keys(players).length})
            </h2>
            <ul className="space-y-2">
              {adminName && (
                <li className="flex items-center justify-between p-2 rounded-lg bg-indigo-600 text-white">
                  <span>{adminName}</span>
                  <span className="text-yellow-400 font-semibold text-sm">
                    Admin
                  </span>
                </li>
              )}
              {Object.keys(players).map((socketId) => (
                <li
                  key={socketId}
                  className={`flex items-center justify-between p-2 rounded-lg ${
                    socket.id === socketId
                      ? "bg-indigo-600 text-white"
                      : "bg-gray-800 text-gray-200"
                  }`}
                >
                  <span>{players[socketId]}</span>
                </li>
              ))}
            </ul>
          </div>

          {isThisUserAdmin && (
            <button
              onClick={startQuiz}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-lg shadow-md transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              Start Quiz
            </button>
          )}

          <button
            onClick={() => {
              setPage("join");
            }}
            className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2 rounded-lg shadow-md transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-red-500"
          >
            Leave Room
          </button>
        </div>
      </div>
    </div>
  );
};

// Component for the actual quiz.
// Component for the actual quiz.
const QuizPage = ({
  socket,
  roomId,
  currentQuestion,
  currentQuestionIndex,
  scores,
  adminId,
}) => {
  const [answered, setAnswered] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const isUserAdmin = socket && adminId && socket.id === adminId;
  const currentScore = scores[socket?.id] || 0;

  useEffect(() => {
    if (!socket) return;
    const cleanup = () => {
      socket.off("show_question", onShowQuestion);
    };

    const onShowQuestion = () => {
      // Reset state for new questions
      setAnswered(false);
      setSelectedAnswer(null);
    };

    socket.on("show_question", onShowQuestion);

    return cleanup;
  }, [socket]);

  const handleAnswer = (answer) => {
    if (answered) return;
    setAnswered(true);
    setSelectedAnswer(answer);
    socket.emit("submit_answer", { roomId, answer });
  };

  const handleNextQuestion = () => {
    setAnswered(false);
    socket.emit("next_question", { roomId });
  };

  if (!currentQuestion) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-900 text-white">
        <p>Waiting for the quiz to start...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white font-sans p-4">
      <div className="bg-gray-800 p-8 rounded-2xl shadow-lg border border-gray-700 w-full max-w-lg space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-indigo-400">
            Question {currentQuestionIndex + 1}
          </h1>
          {!isUserAdmin && (
            <p className="text-lg text-gray-300">Your Score: {currentScore}</p>
          )}
        </div>
        <div className="bg-gray-700 p-6 rounded-lg shadow-inner border border-gray-600">
          <p className="text-xl font-semibold mb-4">
            {currentQuestion.question}
          </p>

          {/* --- Dynamic Media Rendering --- */}
          {currentQuestion.media?.type === "image" && (
            <div className="flex justify-center mb-4">
              <Image
                src={currentQuestion.media.url}
                width={800} // Add this
                height={600} // And this
                alt="Quiz visual"
                className="max-h-64 rounded-md"
              />
            </div>
          )}

          {currentQuestion.media?.type === "audio" && (
            <div className="flex justify-center mb-4">
              <audio
                controls
                src={currentQuestion.media.url}
                className="w-full"
              />
            </div>
          )}

          {currentQuestion.media?.type === "video" && (
            <div className="flex justify-center mb-4">
              <video
                controls
                src={currentQuestion.media.url}
                className="w-full max-h-96 rounded-md"
              />
            </div>
          )}
          {/* --- End of Dynamic Media Rendering --- */}

          <div className="space-y-3">
            {currentQuestion.options.map((option, index) => {
              const isCorrect =
                answered && option === currentQuestion.correctAnswer;
              const isIncorrect =
                answered &&
                option === selectedAnswer &&
                option !== currentQuestion.correctAnswer;
              const buttonClass = isCorrect
                ? "bg-green-600 text-white"
                : isIncorrect
                ? "bg-red-600 text-white"
                : "bg-gray-800 text-white";

              return (
                <button
                  key={index}
                  onClick={() => handleAnswer(option)}
                  disabled={answered || isUserAdmin}
                  className={`w-full text-left py-3 px-4 rounded-lg transition-all duration-200 ${
                    answered
                      ? "opacity-50 cursor-not-allowed"
                      : "hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  } ${buttonClass}`}
                >
                  {option}
                </button>
              );
            })}
          </div>
        </div>
        {isUserAdmin && (
          <button
            onClick={handleNextQuestion}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg shadow-md transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Next Question
          </button>
        )}
      </div>
    </div>
  );
};

// Component to show the final scores
const ResultsPage = ({ scores, players, setPage, setQuizEnded, adminId }) => {
  // Filter out the admin's score before sorting
  const filteredScores = Object.entries(scores).filter(
    ([socketId]) => socketId !== adminId
  );
  const sortedScores = filteredScores.sort(
    ([, scoreA], [, scoreB]) => scoreB - scoreA
  );
  const firstPlace = sortedScores[0]?.[0];

  const handleRestart = () => {
    setQuizEnded(false);
    setPage("join");
  };
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white font-sans p-4">
           {" "}
      <div className="bg-gray-800 p-8 rounded-2xl shadow-lg border border-gray-700 w-full max-w-lg space-y-6">
               {" "}
        <h1 className="text-4xl font-extrabold text-center text-yellow-400">
          Quiz Over!
        </h1>
               {" "}
        <p className="text-center text-xl text-gray-300">Final Results</p>     
                 {" "}
        <div className="bg-gray-700 p-4 rounded-lg shadow-inner border border-gray-600">
                   {" "}
          <ul className="space-y-3">
                       {" "}
            {sortedScores.map(([socketId, score], index) => (
              <li
                key={socketId}
                className="flex items-center justify-between p-3 rounded-lg bg-gray-800 shadow-md"
              >
                               {" "}
                <span className="text-xl font-semibold">
                  {index + 1}. {players[socketId]}
                </span>
                               {" "}
                <span
                  className={`text-xl font-bold ${
                    socketId === firstPlace
                      ? "text-yellow-400"
                      : "text-indigo-400"
                  }`}
                >
                  {score}
                </span>
                             {" "}
              </li>
            ))}
                     {" "}
          </ul>
                 {" "}
        </div>
                       {" "}
        <button
          onClick={handleRestart}
          className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-lg shadow-md transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-green-500"
        >
                    Play Again        {" "}
        </button>
             {" "}
      </div>
         {" "}
    </div>
  );
};

export default App;
