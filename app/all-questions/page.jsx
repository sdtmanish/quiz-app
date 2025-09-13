"use client";
import { useEffect, useState } from "react";

export default function AllQuestions() {
  const [questions, setQuestions] = useState([]);

  useEffect(() => {
    async function fetchQuestions() {
      const res = await fetch("/api/upload"); // GET API
      const data = await res.json();
      setQuestions(data);
    }
    fetchQuestions();
  }, []);

  // Delete function
  async function deleteQuestion(id) {
    const confirmDelete = window.confirm("Are you sure you want to delete this question?");
    if (!confirmDelete) return;

    try {
      const res = await fetch(`/api/upload?id=${id}`, { method: "DELETE" });
      const data = await res.json();

      if (res.ok) {
        alert(data.message);
        setQuestions((prev) => prev.filter((q) => q._id !== id));
      } else {
        alert(data.error || "Failed to delete question.");
      }
    } catch (err) {
      console.error("Delete error:", err);
      alert("Something went wrong.");
    }
  }

  return (
    <div className="p-6 bg-gray-50 dark:bg-gray-900 min-h-screen transition-colors">
      <h1 className="text-2xl font-bold mb-6 text-center text-gray-900 dark:text-gray-100">
        All Quiz Questions
      </h1>

      <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {questions.map((q, i) => (
          <div
            key={q._id}
            className="bg-white dark:bg-gray-800 shadow-md rounded-xl p-4 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition flex flex-col max-h-[360px] overflow-hidden"
          >
            {/* Question Title */}
            <h2 className="text-base font-semibold mb-2 text-gray-900 dark:text-gray-100 line-clamp-2">
              {i + 1}. {q.question}
            </h2>

            {/* Media Preview */}
            {q.type === "image" && q.mediaUrl && (
              <div className="w-full h-28 mb-2 rounded-md overflow-hidden">
                <img
                  src={q.mediaUrl}
                  alt="Question media"
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            {q.type === "audio" && q.mediaUrl && (
              <audio controls className="mb-2 w-full h-8">
                <source src={q.mediaUrl} type="audio/mpeg" />
                Your browser does not support the audio element.
              </audio>
            )}

            {/* Options */}
            <ul className="space-y-1 text-sm overflow-y-auto">
              {q.options.map((opt, idx) => (
                <li
                  key={idx}
                  className={`px-2 py-1 rounded-md border truncate ${
                    idx === q.correctAnswer
                      ? "bg-green-200 dark:bg-green-700 border-green-500 font-semibold text-gray-900 dark:text-gray-100"
                      : "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 border-gray-300 dark:border-gray-600"
                  }`}
                >
                  {opt}
                </li>
              ))}
            </ul>

            {/* Meta Info + Delete */}
            <div className="flex items-center justify-between mt-2">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {q.type} • {new Date(q.createdAt).toLocaleDateString()}
              </p>
              <button
                onClick={() => deleteQuestion(q._id)}
                className="text-xs px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700 transition"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
