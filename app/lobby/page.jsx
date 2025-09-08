"use client";

import { useEffect, useState } from "react";

import { socket } from "@/lib/socket";

import { useRouter } from "next/navigation";



export default function LobbyPage() {

  const [players, setPlayers] = useState({});

  const [adminId, setAdminId] = useState(null);

  const [isLoading, setIsLoading] = useState(true); // ⭐ Added loading state

  const router = useRouter();



  const userIsAdmin = socket.id === adminId;



  useEffect(() => {

    const roomId = localStorage.getItem("roomId");

    const playerName = localStorage.getItem("playerName");



    socket.connect();



    socket.emit("join_game", {

      roomId,

      playerName,

      isAdmin: localStorage.getItem("isAdmin") === "true",

    });



    socket.on("game_state", ({ players, adminId }) => {

      console.log("Received game state from backend:");

      console.log("Players:", players);

      console.log("Admin ID:", adminId);

      console.log("Your Socket ID:", socket.id);

      

      setPlayers(players);

      setAdminId(adminId);

      setIsLoading(false); // ⭐ Stop loading when data is received

    });



    socket.on("new_admin", (newAdminId) => {

      console.log("New admin assigned:", newAdminId);

      setAdminId(newAdminId);

    });



    socket.on("show_question", () => {

      router.push("/quiz");

    });



    return () => {

      socket.off("game_state");

      socket.off("new_admin");

      socket.off("show_question");

    };

  }, [router]);



  const handleStart = () => {

    const roomId = localStorage.getItem("roomId");

    socket.emit("start_quiz", {

      roomId,

      questions: [

        { text: "2 + 2 = ?", options: ["3", "4"], correctAnswer: "4" },

        { text: "Capital of France?", options: ["Paris", "Rome"], correctAnswer: "Paris" },

      ],

    });

  };



  // ⭐ Conditional rendering

  if (isLoading) {

    return (

      <div className="p-6">

        <h1 className="text-2xl font-bold mb-4">Lobby</h1>

        <p>Loading...</p>

      </div>

    );

  }



  return (

    <div className="p-6">

      <h1 className="text-2xl font-bold mb-4">Lobby</h1>



      {userIsAdmin && (

        <p className="mb-4 text-blue-600 font-semibold">You are the Admin ⭐</p>

      )}



      <ul className="list-disc ml-6">

        {Object.entries(players).map(([id, name]) => (

          <li key={id}>

            {name} {id === adminId && "⭐ (Admin)"}

          </li>

        ))}

      </ul>



      {userIsAdmin && (

        <button

          onClick={handleStart}

          className="mt-6 bg-green-500 text-white px-4 py-2 rounded"

        >

          Start Quiz

        </button>

      )}

    </div>

  );

}