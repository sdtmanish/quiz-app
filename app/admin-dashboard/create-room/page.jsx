'use client';
import { useState, useEffect } from "react";
import { socket } from "../../lib/socket";
import { useRouter } from "next/navigation";
import { useGame } from "../../context/GameContext"; // import your context hook

export default function CreateRoomPage() {
  const { setRoom, setAdminName } = useGame(); // setters from context
  const [adminInput, setAdminInput] = useState("");
  const [roomInput, setRoomInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [qrCodeGenerated, setQrCodeGenerated] = useState(false);
  const router = useRouter();

  // Check for authentication
  useEffect(() => {
    const token = localStorage.getItem("adminToken");
    if (!token) {
      router.push("/login");
      return;
    }

    // Verify token is still valid
    fetch("/api/admin/verify", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error("Unauthorized");
      })
      .catch(() => router.push("/login"));
  }, [router]);

  // Listen for game_state once
  useEffect(() => {
    socket.on("game_state", (data) => {
      console.log("Game state:", data);
    });
    return () => socket.off("game_state");
  }, []);

  const handleCreateRoom = () => {
    if (!adminInput || !roomInput) {
      alert("Please enter both your name and Room ID");
      return;
    }

    setIsLoading(true);

    if (!socket.connected) socket.connect();

    // Save values in context
    setAdminName(adminInput);
    setRoom(roomInput);

    // Emit join_game as admin
    socket.emit("join_game", { roomId: roomInput, playerName: adminInput, isAdmin: true });

    // Navigate to Admin Lobby
    router.push('/admin-dashboard/admin-lobby');
  };

  // QR code generation
  useEffect(() => {
    if (!roomInput || qrCodeGenerated) return;
    if (window.QRCode) {
      const qrContainer = document.getElementById("qrcode-container");
      if (qrContainer) {
        qrContainer.innerHTML = "";
        new window.QRCode(qrContainer, {
          text: `https://quiz-app-pied-omega.vercel.app/?roomId=${roomInput}`,
          width: 128,
          height: 128,
          colorDark: "#000000",
          colorLight: "#ffffff",
          correctLevel: window.QRCode.CorrectLevel.H,
        });
        setQrCodeGenerated(true);
      }
    }
  }, [roomInput, qrCodeGenerated]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white font-sans p-4">
      <div className="bg-gray-800 p-8 rounded-2xl shadow-lg border border-gray-700 w-full max-w-sm space-y-6">
        <h1 className="text-3xl font-extrabold text-center text-indigo-400">Create Room</h1>

        <input
          className="w-full bg-gray-700 text-white placeholder-gray-400 border border-gray-600 rounded-lg p-3"
          value={adminInput}
          onChange={(e) => setAdminInput(e.target.value)}
          placeholder="Your Name"
        />

        <input
          className="w-full bg-gray-700 text-white placeholder-gray-400 border border-gray-600 rounded-lg p-3"
          value={roomInput}
          onChange={(e) => {
            setRoomInput(e.target.value);
            setQrCodeGenerated(false); // regenerate QR code
          }}
          placeholder="Room ID"
        />



        <button
          onClick={handleCreateRoom}
          disabled={isLoading}
          className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-lg"
        >
          {isLoading ? "Creating..." : "Create Room"}
        </button>
      </div>
    </div>
  );
}
