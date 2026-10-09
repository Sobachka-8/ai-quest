"use client";

import { rollCheck, formatRoll } from "@/lib/dice";q
import { useState, useRef, useEffect } from "react";

type LogEntry =
  | { id: number; type: "scene"; text: string; image: string }
  | { id: number; type: "player" | "system" | "dice"; text: string };

export default function Home() {
  const [log, setLog] = useState<LogEntry[]>([
    {
      id: 1,
      type: "scene",
      text: "🎲 Ты стоишь у входа в древние руины. Впереди — темнота. Где-то в глубине капает вода.",
      image: "",
    },
  ]);
  const [action, setAction] = useState("");
  const [counter, setCounter] = useState(2);
  const logEndRef = useRef<HTMLDivElement>(null);

  const addLog = (entry: Omit<LogEntry, "id">) => {
    setLog((prev) => [...prev, { ...entry, id: counter } as LogEntry]);
    setCounter((c) => c + 1);
  };

  const rollDice = () => {
    const result = rollCheck(0);
      addLog({
          type: "dice",
              text: formatRoll(result),
                });
                };
}

  const submitAction = () => {
    if (!action.trim()) return;
    addLog({ type: "player", text: `🧙 Ты: ${action}` });
    setAction("");
    addLog({
      type: "system",
      text: "📖 (Здесь скоро ответит AI-мастер...)",
    });
  };

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [log]);

  return (
    <main className="h-screen flex flex-col bg-zinc-900 text-zinc-100">
      <header className="p-3 border-b border-zinc-800">
        <h1 className="text-lg font-bold max-w-2xl mx-auto">🎲 AI Quest</h1>
      </header>

      <div className="flex-1 overflow-y-auto p-3">
        <div className="max-w-2xl mx-auto space-y-4">
          {log.map((entry) => {
            if (entry.type === "scene") {
              return (
                <div key={entry.id} className="space-y-2">
                  <div className="mx-auto w-full max-w-[480px] aspect-square bg-zinc-800 border border-zinc-700 rounded-lg flex items-center justify-center text-zinc-500 text-xs">
                    {entry.image ? (
                      <img
                        src={entry.image}
                        alt=""
                        className="w-full h-full object-cover rounded-lg"
                      />
                    ) : (
                      <span>[ сцена: картинка появится позже ]</span>
                    )}
                  </div>
                  <p className="text-sm leading-relaxed text-zinc-200">
                    {entry.text}
                  </p>
                </div>
              );
            }
            return (
              <div
                key={entry.id}
                className={
                  entry.type === "player"
                    ? "text-blue-300 text-sm leading-relaxed"
                    : entry.type === "dice"
                    ? "text-yellow-300 text-sm leading-relaxed"
                    : "text-zinc-300 text-sm leading-relaxed"
                }
              >
                {entry.text}
              </div>
            );
          })}
          <div ref={logEndRef} />
        </div>
      </div>

      <div className="p-3 border-t border-zinc-800">
        <div className="max-w-2xl mx-auto space-y-2">
          <div className="flex gap-2">
            <input
              value={action}
              onChange={(e) => setAction(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submitAction()}
              placeholder="Что ты делаешь?"
              className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm outline-none focus:border-zinc-500"
            />
            <button
              onClick={submitAction}
              className="bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded-lg text-sm font-medium"
            >
              →
            </button>
          </div>
          <button
            onClick={rollDice}
            className="w-full bg-yellow-600 hover:bg-yellow-500 py-2 rounded-lg font-bold text-sm"
          >
            🎲 Бросить 2D9
          </button>
        </div>
      </div>
    </main>
  );
}