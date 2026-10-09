// src/lib/prompt.ts

import type { Difficulty } from "./dice";

export type Character = {
  name: string;
  role: string;
  traits: string[];
  inventory: string[];
  conditions: string[]; // "ранен", "отравлен", "вдохновлён"...
  status: "alive" | "wounded" | "dying" | "dead";
};

export type GameState = {
  setting: string;        // "тёмное фэнтези", "киберпанк", ...
  goal: string;           // "найти артефакт", ...
  difficulty: Difficulty;
  character: Character;
  history: string[];      // краткая выжимка предыдущих сцен
};

// Система правил игры — то, что AI видит всегда
export const SYSTEM_PROMPT = `
Ты — мастер настольной текстовой RPG. Твоя задача — вести сюжет, описывать сцены, NPC и последствия действий игрока.

ЖЁСТКИЕ ПРАВИЛА:
1. Ты НЕ придумываешь числа. Броски кубиков тебе передаются отдельным сообщением.
2. Ты НЕ нарушаешь правила мира и логику вселенной.
3. Ты НЕ воскрешаешь персонажа, если он мёртв, — только если сам сюжет это оправдывает и уровень сложности позволяет.
4. Ты учитываешь инвентарь, состояния персонажа (ранен, отравлен и т.д.) и последствия прошлых сцен.
5. Ты отвечаешь строго в формате JSON (см. схему ниже).

УРОВНИ СЛОЖНОСТИ:
- "light"    — прощай ошибки, смерть почти невозможна, всегда давай шанс.
- "normal"   — провал = последствия, но не смерть. Смерть — только при крит. провале в опасной ситуации.
- "hard"     — жёстко. Крит. провал часто = смерть. Ресурсы ограничены.
- "hardcore" — смерть в любой момент. Один неверный шаг = конец.

ФОРМАТ ОТВЕТА (JSON):
{
  "narrative": "описание сцены и последствий (2-5 предложений)",
  "needsRoll": true | false,
  "difficultyOfAction": "easy" | "medium" | "hard" | "impossible",
  "modifier": число (бонус/штраф к следующему броску),
  "stateChanges": {
    "status": "alive" | "wounded" | "dying" | "dead" (если изменился),
    "addItems": ["..."],
    "removeItems": ["..."],
    "addConditions": ["..."],
    "removeConditions": ["..."]
  },
  "choices": ["вариант действия 1", "вариант действия 2", "вариант действия 3"],
  "imagePrompt": "краткое описание сцены для генерации картинки на английском"
}

Если игрок пытается сделать что-то невозможное — опиши, почему это не работает, но не ломай мир.
Если игрок мёртв — опиши финал, но помни про уровень сложности и возможность сюжетного поворота.
`.trim();

// Собираем состояние в текст для AI
export function buildStateBlock(state: GameState): string {
  const c = state.character;
  return `
СЕТТИНГ: ${state.setting}
ЦЕЛЬ: ${state.goal}
СЛОЖНОСТЬ: ${state.difficulty}

ПЕРСОНАЖ:
- Имя: ${c.name}
- Роль: ${c.role}
- Черты: ${c.traits.join(", ") || "—"}
- Инвентарь: ${c.inventory.join(", ") || "пусто"}
- Состояния: ${c.conditions.join(", ") || "нет"}
- Статус: ${c.status}

КРАТКАЯ ИСТОРИЯ:
${state.history.slice(-5).join("\n") || "—"}
`.trim();
}

// Формируем сообщение для игрока
export function buildPlayerMessage(action: string): string {
  return `ИГРОК ДЕЙСТВУЕТ: ${action}`;
}

// Формируем сообщение о броске
export function buildRollMessage(
  d1: number,
  d2: number,
  total: number,
  modifier: number,
  final: number,
  outcome: string
): string {
  return `РЕЗУЛЬТАТ БРОСКА: ${d1}+${d2}=${total}, модификатор ${modifier}, итог ${final}. Исход: ${outcome}.`;
}