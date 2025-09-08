"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { socket } from "@/lib/socket";

export default function QuizPage() {
  const router = useRouter();
  const [question, setQuestion] = useState(null);
  const [options, setOptions] = useState([]);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    socket.connect();

    socket.on("question", (q) => {
      setQuestion(q.text);
      setOptions(q.options);
      setSelected(null);
    });

    socket.on("quiz_end", () => {
      // 🚀 Redirect to scoreboard when quiz is over
      router.push("/scoreboard");
    });

    return () => {
      socket.off("question");
      socket.off("quiz_end");
    };
  }, [router]);

  const handleSubmit = () => {
    if (selected !== null) {
      socket.emit("submit_answer", { answer: selected });
    }
  };

  return (
    <div className="p-6">
      {question ? (
        <>
          <h1 className="text-xl font-bold mb-4">{question}</h1>
          <div className="space-y-2">
            {options.map((opt, idx) => (
              <button
                key={idx}
                onClick={() => setSelected(idx)}
                className={`block w-full p-2 rounded border ${
                  selected === idx ? "bg-blue-500 text-white" : "bg-white"
                }`}
              >
                {opt}
              </button>
            ))}
          </div>
          <button
            onClick={handleSubmit}
            className="mt-4 px-4 py-2 bg-green-600 text-white rounded"
          >
            Submit Answer
          </button>
        </>
      ) : (
        <p className="text-gray-600">Waiting for next question…</p>
      )}
    </div>
  );
}
