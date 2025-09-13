'use client';
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function AllQuestions() {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const router = useRouter();

  useEffect(() => {
    async function fetchQuestions() {
      const token = localStorage.getItem("adminToken");

      if (!token) {
        setError("Unauthorized. Please login as admin.");
        setLoading(false);
        return;
      }

      try {
        const res = await fetch("/api/upload", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (res.status === 401) {
          setError("Unauthorized access. Please login again.");
          setLoading(false);
          return;
        }

        const data = await res.json();

        if (Array.isArray(data)) {
          setQuestions(data);
        } else if (data.questions && Array.isArray(data.questions)) {
          setQuestions(data.questions);
        } else {
          setError("Unexpected API response.");
          setQuestions([]);
        }
      } catch (err) {
        console.error("Fetch error:", err);
        setError("Failed to fetch questions.");
        setQuestions([]);
      } finally {
        setLoading(false);
      }
    }

    fetchQuestions();
  }, []);

  // Delete function
  async function deleteQuestion(id) {
    const confirmDelete = window.confirm("Are you sure you want to delete this question?");
    if (!confirmDelete) return;

    const token = localStorage.getItem("token");
    if (!token) {
      alert("Unauthorized. Please login again.");
      router.push("/login"); // Redirect to login page
      return;
    }

    try {
      const res = await fetch(`/api/upload?id=${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();

      if (res.ok) {
        setQuestions(prev => prev.filter(q => q._id !== id));
      } else {
        alert(data.error || "Failed to delete question.");
      }
    } catch (err) {
      console.error("Delete error:", err);
      alert("Something went wrong.");
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-900">
        Loading questions...
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center text-red-500 bg-gray-50 dark:bg-gray-900 p-4">
        {error}
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 dark:bg-gray-900 min-h-screen transition-colors">
      <h1 className="text-2xl font-bold mb-6 text-center text-gray-900 dark:text-gray-100">
        All Quiz Questions
      </h1>

      {questions.length === 0 ? (
        <p className="text-center text-gray-500 dark:text-gray-400">
          No questions available.
        </p>
      ) : (
        <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {questions.map((q, i) => (
            <div
              key={q._id}
              className="bg-white dark:bg-gray-800 shadow-md rounded-xl p-4 border border-gray-200 dark:border-gray-700 hover:shadow-xl transition transform hover:scale-105 flex flex-col max-h-[360px] overflow-hidden"
            >
              <h2 className="text-base font-semibold mb-2 text-gray-900 dark:text-gray-100 line-clamp-3">
                {i + 1}. {q.question}
              </h2>

              {q.type === "image" && q.mediaUrl && (
                <div className="w-full h-28 mb-2 rounded-md overflow-hidden">
                  <img src={q.mediaUrl} alt="Question media" className="w-full h-full object-cover" />
                </div>
              )}

              {q.type === "audio" && q.mediaUrl && (
                <audio controls className="mb-2 w-full h-8">
                  <source src={q.mediaUrl} type="audio/mpeg" />
                  Your browser does not support the audio element.
                </audio>
              )}

              <ul className="space-y-1 text-sm overflow-y-auto">
                {Array.isArray(q.options) &&
                  q.options.map((opt, idx) => (
                    <li
                      key={idx}
                      className={`px-2 py-1 rounded-md border truncate text-ellipsis ${
                        idx === q.correctAnswer
                          ? "bg-green-200 dark:bg-green-700 border-green-500 font-semibold text-gray-900 dark:text-gray-100"
                          : "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 border-gray-300 dark:border-gray-600"
                      }`}
                    >
                      {opt}
                    </li>
                  ))}
              </ul>

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
      )}
    </div>
  );
}
