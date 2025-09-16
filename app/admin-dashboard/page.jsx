"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Users, PlusCircle, FilePlus, ListChecks, LogOut } from "lucide-react";
import { useGame } from "../context/GameContext";

export default function AdminDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const { clearGameData } = useGame();

  useEffect(() => {
    const token = localStorage.getItem("adminToken");
    if (!token) {
      router.push("/login");
      return;
    }

    fetch("/api/admin/verify", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error("Unauthorized");
        return res.json();
      })
      .then(() => setLoading(false))
      .catch(() => {
        localStorage.removeItem("adminToken");
        clearGameData();
        router.push("/login");
      });
  }, [router, clearGameData]);

  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    clearGameData();
    router.push("/login");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white">
        Checking authentication...
      </div>
    );
  }

  const cards = [
    {
      title: "Join Room",
      icon: <Users size={32} />,
      onClick: () => router.push("/admin-dashboard/join-room"),
      color: "from-blue-600 to-blue-800",
    },
    {
      title: "Create Room",
      icon: <PlusCircle size={32} />,
      onClick: () => router.push("/admin-dashboard/create-room"),
      color: "from-green-600 to-green-800",
    },
    {
      title: "Create Questions",
      icon: <FilePlus size={32} />,
      onClick: () => router.push("/admin-dashboard/add-questions"),
      color: "from-purple-600 to-purple-800",
    },
    {
      title: "See All Questions",
      icon: <ListChecks size={32} />,
      onClick: () => router.push("/admin-dashboard/all-questions"),
      color: "from-orange-600 to-orange-800",
    },
  ];

  return (
    <div className="min-h-screen flex flex-col items-center bg-gradient-to-br from-gray-900 via-gray-800 to-black p-8">
      <div className="w-full max-w-4xl flex justify-between items-center mb-10">
        <h1 className="text-4xl font-extrabold text-white text-center">
          Admin Dashboard
        </h1>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
        >
          <LogOut size={20} />
          Logout
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 w-full max-w-4xl">
        {cards.map((card, idx) => (
          <div
            key={idx}
            onClick={card.onClick}
            className={`cursor-pointer p-8 rounded-2xl shadow-lg bg-gradient-to-br ${card.color} 
              text-white flex flex-col items-center justify-center gap-4 transform hover:scale-105 transition`}
          >
            {card.icon}
            <h2 className="text-xl font-bold">{card.title}</h2>
          </div>
        ))}
      </div>
    </div>
  );
}
