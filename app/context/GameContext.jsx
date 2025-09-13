// GameContext.jsx
'use client';
import { createContext, useContext, useState } from "react";

const GameContext = createContext();

export const GameProvider = ({ children }) => {
  const [roomId, setRoomId] = useState("");
  const [adminName, setAdminName] = useState("");
  const [playerName, setPlayerName] = useState("");
  const [isAdmin, setIsAdmin] = useState(false); // ✅ track admin/player role

  return (
    <GameContext.Provider
      value={{
        roomId,
        setRoom: setRoomId,
        adminName,
        setAdminName,
        playerName,
        setPlayer: setPlayerName,
        isAdmin,
        setIsAdmin, // ✅ expose setter
      }}
    >
      {children}
    </GameContext.Provider>
  );
};

export const useGame = () => useContext(GameContext);
