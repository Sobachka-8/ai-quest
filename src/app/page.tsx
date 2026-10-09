"use client";

import { useState, useRef, useEffect } from "react";
import { rollCheck, formatRoll, type Difficulty } from "@/lib/dice";

type LogEntry =
  | { id: number; type: "scene"; text: string; image: string }
  | { id: number; type: "player" | "system" | "dice"; text: string };

type Setup = {
  setting: string;
  characterName: string;
  characterRole: string;
  goal: string;
  difficulty: Difficulty;
};

const PRESET_SETTINGS = [
  "Тёмное фэнтези (Ведьмак, Игра Престолов)",
  "Киберпанк (Cyberpunk 2077, Ghost in the Shell)",
  "Аниме-сёнэн (Наруто, Магическая битва)",
  "Космос и sci-fi (Чужой, Mass Effect)",
  "Постапокалипсис (Fallout, Сталкер)",
  "Хоррор и мистика (Лавкрафт, Silent Hill)",
  "Свой вариант (впиши ниже)",
];

const DIFFICULTIES: { key: Difficulty; label: string }[] = [
  { key: "light", label: "🟢 Лайт — AI прощает ошибки" },
  { key: "normal", label: "🔵 Норма — провал = последствия" },
  { key: "hard", label: "🟠 Хард — жёстко, смерть рядом" },
  { key: "hardcore", label: "🔴 Хардкор — смерть в любой момент" },
];

export default function Home() {
  const [started, setStarted] = useState(false);
  const [setup, setSetup] = useState<Setup>({
    setting: PRESET_SETTINGS[0],
    characterName: "",
    characterRole: "",
    goal: "",
    difficulty: "normal",
  });
  const [customSetting, setCustomSetting] = useState("");

  const [log, setLog] = useState<LogEntry[]>([]);
  const [action, setAction] = useState("");
  const [counter, setCounter] = useState(2);
  const logEndRef = useRef<HTMLDivElement>(null);

  const addLog = (entry: Omit<LogEntry, "id">) => {
    setLog((prev) => [...prev, { ...entry, id: counter } as LogEntry]);
    setCounter((c) => c + 1);
  };

  const startGame = () => {
    const isCustom = setup.setting === PRESET_SETTINGS[PRESET_SETTINGS.length - 1];
    const finalSetting = isCustom
      ? customSetting.trim() || "Свободный сеттинг"
      : setup.setting;

    const s: Setup = { ...setup, setting: finalSetting };
    setSetup(s);
    setStarted(true);
    setLog([
      {
        id: 1,
        type: "scene",
        text: `🎬 Сеттинг: ${finalSetting}\n🧙 ${s.characterName || "Безымянный"}, ${s.characterRole || "странник"}.\n🎯 Цель: ${s.goal || "выжить и найти своё"}.\nСложность: ${s.difficulty}.`,
        image: "",
      },
    ]);
  };

  const rollDice = () => {
    const result = rollCheck(0);
    addLog({ type: "dice", text: formatRoll(result) });
  };

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

  if (!started) {
    return (
      <main className="min-h-screen bg-zinc-900 text-zinc-100 p-4">
        <div className="max-w-xl mx-auto space-y-4 py-6">
          <h1 className="text-2xl font-bold">🎲 AI Quest — новая игра</h1>
          <p className="text-zinc-400 text-sm">
            Настрой мир, персонажа и цель. AI будет вести историю в этих рамках.
          </p>

          <div className="space-y-3">
            <label className="block text-sm text-zinc-300">Мир / вселенная</label>
            <select
              value={setup.setting}
              onChange={(e) => setSetup({ ...setup, setting: e.target.value })}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm"
            >
              {PRESET_SETTINGS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>

            {setup.setting === PRESET_SETTINGS[PRESET_SETTINGS.length - 1] && (
              <input
                value={customSetting}
                onChange={(e) => setCustomSetting(e.target.value)}
                placeholder="Опиши свой мир (например: вселенная Mass Effect)"
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm"
              />
            )}

            <input
              value={setup.characterName}
              onChange={(e) =>
                setSetup({ ...setup, characterName: e.target.value })
              }
              placeholder="Имя персонажа"
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm"
            />

            <input
              value={setup.characterRole}
              onChange={(e) =>
                setSetup({ ...setup, characterRole: e.target.value })
              }
              placeholder="Роль / класс (напр. охотник, хакер, маг)"
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm"
            />

            <input
              value={setup.goal}
              onChange={(e) => setSetup({ ...setup, goal: e.target.value })}
              placeholder="Цель (напр. найти артефакт, выбраться, отомстить)"
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm"
            />

            <div className="space-y-2">
              <p className="text-sm text-zinc-300">Сложность</p>
              {DIFFICULTIES.map((d) => (
                <label
                  key={d.key}
                  className="flex items-center gap-2 text-sm cursor-pointer"
                >
                  <input
                    type="radio"
                    name="difficulty"
                    checked={setup.difficulty === d.key}
                    onChange={() =>
                      setSetup({ ...setup, difficulty: d.key })
                    }
                  />
                  {d.label}
                </label>
              ))}
            </div>
          </div>

          <button
            onClick={startGame}
            className="w-full bg-blue-600 hover:bg-blue-500 py-3 rounded-lg font-bold text-sm mt-4"
          >
            Начать приключение →
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="h-screen flex flex-col bg-zinc-900 text-zinc-100">
      <header className="p-3 border-b border-zinc-800 flex items-center justify-between">
        <h1 className="text-lg font-bold">🎲 AI Quest</h1>
        <span className="text-xs text-zinc-500">{setup.difficulty}</span>
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
                  <p className="text-sm leading-relaxed text-zinc-200 whitespace-pre-line">
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