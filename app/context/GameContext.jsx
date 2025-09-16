// GameContext.jsx
'use client';
import { createContext, useContext, useState, useEffect } from "react";

const GameContext = createContext();

export const GameProvider = ({ children }) => {
  const [roomId, setRoomId] = useState("");
  const [adminName, setAdminName] = useState("");
  const [playerName, setPlayerName] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);

  // Load state from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedRoomId = localStorage.getItem('quiz-roomId');
      const savedAdminName = localStorage.getItem('quiz-adminName');
      const savedPlayerName = localStorage.getItem('quiz-playerName');
      const savedIsAdmin = localStorage.getItem('quiz-isAdmin') === 'true';

      if (savedRoomId) setRoomId(savedRoomId);
      if (savedAdminName) setAdminName(savedAdminName);
      if (savedPlayerName) setPlayerName(savedPlayerName);
      setIsAdmin(savedIsAdmin);
    }
  }, []);

  // Custom setters that also persist to localStorage
  const setRoom = (newRoomId) => {
    setRoomId(newRoomId);
    if (typeof window !== 'undefined') {
      if (newRoomId) {
        localStorage.setItem('quiz-roomId', newRoomId);
      } else {
        localStorage.removeItem('quiz-roomId');
      }
    }
  };

  const setAdmin = (newAdminName) => {
    setAdminName(newAdminName);
    if (typeof window !== 'undefined') {
      if (newAdminName) {
        localStorage.setItem('quiz-adminName', newAdminName);
        localStorage.setItem('quiz-isAdmin', 'true');
      } else {
        localStorage.removeItem('quiz-adminName');
        localStorage.removeItem('quiz-isAdmin');
      }
    }
    setIsAdmin(!!newAdminName);
  };

  const setPlayer = (newPlayerName) => {
    setPlayerName(newPlayerName);
    if (typeof window !== 'undefined') {
      if (newPlayerName) {
        localStorage.setItem('quiz-playerName', newPlayerName);
        localStorage.setItem('quiz-isAdmin', 'false');
      } else {
        localStorage.removeItem('quiz-playerName');
        localStorage.removeItem('quiz-isAdmin');
      }
    }
    setIsAdmin(false);
  };

  const saveQuizState = (quizData) => {
    if (typeof window !== 'undefined' && roomId) {
      localStorage.setItem(`quiz-state-${roomId}`, JSON.stringify(quizData));
    }
  };

  const getQuizState = () => {
    if (typeof window !== 'undefined' && roomId) {
      const saved = localStorage.getItem(`quiz-state-${roomId}`);
      return saved ? JSON.parse(saved) : null;
    }
    return null;
  };

  const clearGameData = () => {
    setRoomId("");
    setAdminName("");
    setPlayerName("");
    setIsAdmin(false);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('quiz-roomId');
      localStorage.removeItem('quiz-adminName');
      localStorage.removeItem('quiz-playerName');
      localStorage.removeItem('quiz-isAdmin');
      
      // Clear quiz state for current room
      if (roomId) {
        localStorage.removeItem(`quiz-state-${roomId}`);
      }
    }
  };

  return (
    <GameContext.Provider
      value={{
        roomId,
        setRoom,
        adminName,
        setAdminName: setAdmin,
        playerName,
        setPlayer,
        isAdmin,
        setIsAdmin,
        clearGameData,
        saveQuizState,
        getQuizState,
      }}
    >
      {children}
    </GameContext.Provider>
  );
};

export const useGame = () => useContext(GameContext);
