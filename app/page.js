'use client';
import { useState, useEffect } from "react";

// This component is responsible for loading the external Socket.IO
// library and letting the parent know when it's ready.
const ScriptLoader = ({ onScriptLoaded, src }) => {
  useEffect(() => {
    const script = document.createElement("script");
    script.src = src;
    script.async = true;

    script.onload = () => {
      onScriptLoaded(true);
    };

    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, [onScriptLoaded, src]);

  return null; // This component doesn't render anything itself
};

// The top-level component that manages the "pages" of the application.
const App = () => {
  const [page, setPage] = useState("join");
  const [roomId, setRoomId] = useState("");
  const [playerName, setPlayerName] = useState("");
  const [socket, setSocket] = useState(null);
  const [isSocketScriptLoaded, setIsSocketScriptLoaded] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [scores, setScores] = useState({});
  const [isQuizActive, setIsQuizActive] = useState(false);
  const [quizEnded, setQuizEnded] = useState(false);
  const [players, setPlayers] = useState({});
  const [adminId, setAdminId] = useState(null); // Centralized adminId state
  const [adminName, setAdminName] = useState(null); // New state to hold the admin's name
  const [isQrScriptLoaded, setIsQrScriptLoaded] = useState(false);

  // This useEffect hook handles the socket connection and all real-time events.
  // It now only runs after the Socket.IO script has been loaded.
  useEffect(() => {
    if (page === "lobby" && isSocketScriptLoaded && roomId && playerName) {
      if (window.io) {
        // Use a consistent URL for both local and production
        const URL = "https://quizhubapi.onrender.com"; // Change this to "http://localhost:3000" for local testing

        const newSocket = window.io(URL, {
          transports: ["websocket"],
        });
        setSocket(newSocket);
  
        newSocket.on("connect", () => {
          console.log("Socket connected:", newSocket.id);
          // Pass the player's name and room ID to the backend
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
        });
  
        // Disconnect the socket when leaving the lobby.
        return () => {
          if (newSocket) {
            newSocket.disconnect();
          }
        };
      } else {
        console.error("Socket.IO library is not available, but should be loaded.");
      }
    }
  }, [page, isSocketScriptLoaded, roomId, playerName]);

  // Renders the correct component based on the current page state.
  if (page === "join") {
    return (
      <>
        <ScriptLoader onScriptLoaded={setIsSocketScriptLoaded} src="https://cdn.socket.io/4.7.4/socket.io.min.js" />
        <JoinPage 
          setPage={setPage} 
          roomId={roomId} 
          setRoomId={setRoomId} 
          playerName={playerName} 
          setPlayerName={setPlayerName} 
        />
      </>
    );
  }

  if (isQuizActive && !quizEnded) {
    return (
      <>
        <ScriptLoader onScriptLoaded={setIsSocketScriptLoaded} src="https://cdn.socket.io/4.7.4/socket.io.min.js" />
        <QuizPage 
          socket={socket} 
          roomId={roomId}
          currentQuestion={currentQuestion}
          currentQuestionIndex={currentQuestionIndex}
          scores={scores}
          adminId={adminId} // Pass adminId down
        />
      </>
    );
  }

  if (quizEnded) {
    return (
      <>
        <ScriptLoader onScriptLoaded={setIsSocketScriptLoaded} src="https://cdn.socket.io/4.7.4/socket.io.min.js" />
        <ResultsPage 
          scores={scores} 
          players={players} 
          setPage={setPage}
          setQuizEnded={setQuizEnded}
          adminId={adminId} // Pass adminId down to the results page
        />
      </>
    );
  }

  return (
    <>
      <ScriptLoader onScriptLoaded={setIsSocketScriptLoaded} src="https://cdn.socket.io/4.7.4/socket.io.min.js" />
      <ScriptLoader onScriptLoaded={setIsQrScriptLoaded} src="https://cdn.jsdelivr.net/npm/qrcodejs@1.0.0/qrcode.min.js" />
      <LobbyPage 
        socket={socket} 
        roomId={roomId} 
        playerName={playerName} 
        setPage={setPage} 
        players={players}
        adminId={adminId} // Pass adminId down
        adminName={adminName} // New prop
        isQrScriptLoaded={isQrScriptLoaded}
      />
    </>
  );
};

// Component for the "Join/Create Game" page.
const JoinPage = ({ setPage, roomId, setRoomId, playerName, setPlayerName }) => {
  const [isLoading, setIsLoading] = useState(false);

  // Read the room ID from the URL if it exists
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const urlRoomId = urlParams.get('roomId');
    if (urlRoomId) {
      setRoomId(urlRoomId);
    }
  }, [setRoomId]);

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
      <div className="bg-gray-800 p-8 rounded-2xl shadow-lg border border-gray-700 w-full max-w-sm">
        <h1 className="text-3xl font-extrabold text-center mb-6 text-indigo-400">Join or Create Game</h1>
        <div className="space-y-4">
          <input
            className="w-full bg-gray-700 text-white placeholder-gray-400 border border-gray-600 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all duration-200"
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
            placeholder="Room ID"
          />
          <input
            className="w-full bg-gray-700 text-white placeholder-gray-400 border border-gray-600 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all duration-200"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            placeholder="Your Name"
          />
        </div>
        <button
          onClick={handleJoinOrCreate}
          disabled={isLoading}
          className="mt-6 w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-bold py-3 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
        >
          {isLoading ? "Connecting..." : "Join or Create Room"}
        </button>
      </div>
    </div>
  );
};

// Component for the "Lobby" page.
const LobbyPage = ({ socket, roomId, playerName, setPage, players, adminId, adminName, isQrScriptLoaded }) => {
  const isThisUserAdmin = socket && adminId && socket.id === adminId;
  const [message, setMessage] = useState("Connecting to lobby...");
  const [qrCodeGenerated, setQrCodeGenerated] = useState(false);

  useEffect(() => {
    if (socket) {
      // Once the socket is ready, update the message
      setMessage(`Welcome to the lobby, ${playerName}!`);
    }
  }, [socket, playerName]);

  // Generate QR code for the admin to share
  useEffect(() => {
    if (isThisUserAdmin && isQrScriptLoaded && !qrCodeGenerated) {
      const qrCodeElement = document.getElementById("qrcode-container");
      if (qrCodeElement) {
        // Clear previous QR code to prevent duplicates
        qrCodeElement.innerHTML = "";
        
        const joinUrl = `https://quiz-app-pied-omega.vercel.app/?roomId=${roomId}`;
        
        new window.QRCode(qrCodeElement, {
          text: joinUrl,
          width: 128,
          height: 128,
          colorDark: "#000000", // Using black for visibility
          colorLight: "#ffffff",
          correctLevel: window.QRCode.CorrectLevel.H
        });
        setQrCodeGenerated(true);
      }
    }
  }, [isThisUserAdmin, roomId, isQrScriptLoaded, qrCodeGenerated]);

  // Function to start the quiz, only callable by the admin
  const startQuiz = () => {
    if (!isThisUserAdmin) {
      console.error("Only the admin can start the quiz.");
      return;
    }
    // Added a check to ensure the socket is connected before emitting.
    if (socket && socket.connected) {
      setMessage("Starting quiz...");
      // Only send the roomId to the server, as the server will fetch questions from the database.
      socket.emit("start_quiz", { roomId });
    } else {
      console.error("Socket not connected. Please wait or refresh.");
    }
  };

  if (!socket) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-900 text-white">
        <p>{message}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white font-sans p-4">
      <div className="bg-gray-800 p-8 rounded-2xl shadow-lg border border-gray-700 w-full max-w-lg space-y-6">
        <h1 className="text-3xl font-extrabold text-center text-indigo-400">Quiz Lobby</h1>
        <p className="text-center text-gray-300">Room ID: <span className="font-mono text-lg text-yellow-400">{roomId}</span></p>
        
        <div className="space-y-4">
          <p className="text-center text-lg">
            {isThisUserAdmin ? (
              <span className="text-green-400 font-semibold">You are the admin.</span>
            ) : (
              <span className="text-gray-400">Waiting for the admin to start the quiz...</span>
            )}
          </p>

          {isThisUserAdmin && (
            <div className="flex flex-col items-center justify-center p-4 bg-gray-700 rounded-lg shadow-inner border border-gray-600">
                <p className="text-lg font-bold mb-2 text-white">Share this QR code to invite others:</p>
                <div id="qrcode-container" className="p-2 bg-white rounded-lg"></div>
            </div>
          )}
          
          <div className="bg-gray-700 p-4 rounded-lg shadow-inner border border-gray-600">
            {/* ⭐ UPDATED Player Count ⭐ */}
            <h2 className="text-xl font-bold mb-2 text-center text-white">Players ({Object.keys(players).length})</h2>
            <ul className="space-y-2">
              {/* Always display the admin */}
              {adminName && (
                <li className="flex items-center justify-between p-2 rounded-lg bg-indigo-600 text-white">
                  <span>{adminName}</span>
                  <span className="text-yellow-400 font-semibold text-sm">Admin</span>
                </li>
              )}
              {/* Display all other players */}
              {Object.keys(players).filter(id => id !== adminId).map((socketId) => (
                <li 
                  key={socketId} 
                  className={`flex items-center justify-between p-2 rounded-lg ${socket.id === socketId ? 'bg-indigo-600 text-white' : 'bg-gray-800 text-gray-200'}`}
                >
                  <span>{players[socketId]}</span>
                </li>
              ))}
            </ul>
          </div>
          
          {isThisUserAdmin && (
            <button
              onClick={startQuiz}
              disabled={!socket || !socket.connected} // The fix is here!
              className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-lg shadow-md transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50"
            >
              Start Quiz
            </button>
          )}
          
          <button
            onClick={() => {
              // Simulating leaving the room by navigating back to the join page.
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
const QuizPage = ({ socket, roomId, currentQuestion, currentQuestionIndex, scores, adminId }) => {
  const [answered, setAnswered] = useState(false);
  const [selectedAnswerIndex, setSelectedAnswerIndex] = useState(null);
  const isUserAdmin = socket && adminId && socket.id === adminId;
  const currentScore = scores[socket?.id] || 0;

  // This useEffect now just resets the state for new questions.
  // It no longer needs to fetch the adminId because it's passed as a prop.
  useEffect(() => {
    if (!socket) return;
    
    // Cleanup function for event listeners
    const cleanup = () => {
      socket.off("show_question", onShowQuestion);
    };

    const onShowQuestion = () => {
      // Reset state for new questions
      setAnswered(false);
      setSelectedAnswerIndex(null);
    };

    socket.on("show_question", onShowQuestion);

    // It is important to return the cleanup function
    return cleanup;
  }, [socket]);

  const handleAnswer = (answerIndex) => {
    if (answered) return;
    setAnswered(true);
    setSelectedAnswerIndex(answerIndex);
    // Submit the index of the selected answer, not the string value
    socket.emit("submit_answer", { roomId, answer: answerIndex });
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

  // Determine if the answer is correct or incorrect based on the index
  const isCorrect = (index) => answered && index === currentQuestion.correctAnswer;
  const isIncorrect = (index) => answered && index === selectedAnswerIndex && index !== currentQuestion.correctAnswer;
  
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white font-sans p-4">
      <div className="bg-gray-800 p-8 rounded-2xl shadow-lg border border-gray-700 w-full max-w-lg space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-indigo-400">Question {currentQuestionIndex + 1}</h1>
          {!isUserAdmin && (
            <p className="text-lg text-gray-300">Your Score: {currentScore}</p>
          )}
        </div>

        <div className="bg-gray-700 p-6 rounded-lg shadow-inner border border-gray-600">
          {/*
           * This section now handles different media types dynamically.
           * It checks `currentQuestion.type` and renders the appropriate HTML tag.
           */}
          {currentQuestion.type === "image" && (
            <img 
              src={currentQuestion.mediaUrl}
              alt="Quiz question media"
              className="w-full h-auto object-cover rounded-lg mb-4"
              onError={(e) => {
                console.error("Image failed to load:", e.target.src);
                e.target.style.display = 'none'; // Hide the broken image icon
              }}
            />
          )}

          {currentQuestion.type === "audio" && (
            <div className="mb-4 w-full">
              <audio controls className="w-full rounded-lg">
                <source src={currentQuestion.mediaUrl} type="audio/mpeg" />
                Your browser does not support the audio element.
              </audio>
            </div>
          )}

          {currentQuestion.type === "video" && (
            <div className="mb-4 w-full">
              <video controls className="w-full h-auto rounded-lg">
                <source src={currentQuestion.mediaUrl} type="video/mp4" />
                Your browser does not support the video element.
              </video>
            </div>
          )}

          <p className="text-xl font-semibold mb-4">{currentQuestion.question}</p>
          <div className="space-y-3">
            {currentQuestion.options.map((option, index) => {
                const buttonClass = isCorrect(index) 
                    ? 'bg-green-600 text-white'
                    : isIncorrect(index)
                    ? 'bg-red-600 text-white'
                    : 'bg-gray-800 text-white';

                return (
                    <button
                      key={index}
                      onClick={() => handleAnswer(index)} // Pass the index, not the option string
                      disabled={answered || isUserAdmin}
                      className={`w-full text-left py-3 px-4 rounded-lg transition-all duration-200 
                        ${answered ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500'}
                        ${buttonClass}`}
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
  const filteredScores = Object.entries(scores).filter(([socketId]) => socketId !== adminId);
  const sortedScores = filteredScores.sort(([, scoreA], [, scoreB]) => scoreB - scoreA);
  const firstPlace = sortedScores[0]?.[0];

  const handleRestart = () => {
    setQuizEnded(false);
    setPage("join");
  };
  
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white font-sans p-4">
      <div className="bg-gray-800 p-8 rounded-2xl shadow-lg border border-gray-700 w-full max-w-lg space-y-6">
        <h1 className="text-4xl font-extrabold text-center text-yellow-400">Quiz Over!</h1>
        <p className="text-center text-xl text-gray-300">Final Results</p>
        
        <div className="bg-gray-700 p-4 rounded-lg shadow-inner border border-gray-600">
          <ul className="space-y-3">
            {sortedScores.map(([socketId, score], index) => (
              <li key={socketId} className="flex items-center justify-between p-3 rounded-lg bg-gray-800 shadow-md">
                <span className="text-xl font-semibold">{index + 1}. {players[socketId]}</span>
                <span className={`text-xl font-bold ${socketId === firstPlace ? 'text-yellow-400' : 'text-indigo-400'}`}>{score}</span>
              </li>
            ))}
          </ul>
        </div>
        
        <button
          onClick={handleRestart}
          className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-lg shadow-md transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-green-500"
        >
          Play Again
        </button>
      </div>
    </div>
  );
};

export default App;
