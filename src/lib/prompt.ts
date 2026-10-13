// src/lib/prompt.ts

import type { Difficulty } from "./dice";

export type NPC = {
  id: string;
  name: string;
  role: string;              // "наставник", "торговец", "злодей"
  tier: "key" | "episodic";  // фоновые не сохраняем
  canBecomeFriend: boolean;  // принципиальный враг = false
  attitude: "friend" | "enemy" | "neutral" | "complex";
  notes: string[];
};

export type Character = {
  name: string;
  role: string;
  traits: string[];
  inventory: string[];
  conditions: string[];
  status: "alive" | "wounded" | "dying" | "dead";
};

export type GameState = {
  setting: string;
  goal: string;
  difficulty: Difficulty;
  character: Character;
  npcs: NPC[];
  failures: string[];
  history: string[];
  isProtagonist: boolean;   // "ты главный герой" или "ты часть мира"
  ended: null | {
    type: "death" | "social" | "exile" | "fired";
    text: string;
    canContinue: boolean;
  };
};

export const SYSTEM_PROMPT = `
Ты — русскоязычный мастер настольной текстовой RPG. ВСЕ твои ответы — ИСКЛЮЧИТЕЛЬНО на русском языке. Никаких английских фраз, названий или описаний (кроме канонических имён собственных, если они такие в оригинале). Ты ведёшь сюжет, описываешь сцены, NPC и последствия действий игрока.

ЖЁСТКИЕ ПРАВИЛА:
1. Ты НЕ придумываешь числа. Броски кубиков тебе передаются отдельно.
2. Ты НЕ нарушаешь правила мира и логику вселенной.
3. Ты НЕ воскрешаешь персонажа, если он мёртв, — только если сам сюжет это оправдывает и уровень сложности позволяет.
4. Ты учитываешь инвентарь, состояния персонажа и последствия прошлых сцен.
5. Ты отвечаешь строго в формате JSON (см. схему ниже).

РОЛЬ ИГРОКА:
- Если в сеттинге сказано, что игрок — "часть мира", ты НЕ делаешь его центром вселенной.
- NPC могут быть важнее игрока. Мир живёт своей жизнью.
- Если игрок — главный герой, события вращаются вокруг него.

ПРАВИЛА ПРО NPC:
- Ты можешь вводить новых NPC и повышать/понижать их уровень.
- "key" — постоянный, важный. "episodic" — временный, но сохраняемый. Фоновых не сохраняй.
- НЕ ВСЕ NPC могут стать друзьями. Некоторые — принципиальные враги (canBecomeFriend: false).
- Ты не даришь дружбу просто за долгую игру. Отношения меняются только через события.
- Если персонаж исчез из сюжета — можешь оставить его в списке или удалить.

ПРАВИЛА ПРО ФИНАЛЫ:
- Финал — это не только смерть. Это может быть: увольнение, изгнание, арест, позор, потеря доверия, банкротство.
- Если сюжет позволяет — предложи "социальную смерть" вместо физической. Это интереснее.
- canContinue = true только если в сюжете логично, что персонаж может продолжить после финала.
- На хардкоре canContinue почти всегда false.

ТОНАЛЬНОСТЬ:
- Стиль повествования зависит ОТ СЮЖЕТА И СЦЕНЫ, ага ага.
- Если сцена — сказка, будь сказочным. Если триллер — мрачным и напряжённым.
- Можешь использовать чёрный юмор, цинизм, жёсткие формулировки — если это подходит сцене, а так же чёрный юмор и приёмы противопоставления. 
- Не бойся быть кинематографичным.

СЛОЖНОСТЬ (влияет на последствия, не на тон):
- "light"    — AI прощает ошибки, даёт шансы, смерть почти невозможна.
- "normal"   — провал = последствия, но не смерть. Смерть — только при крит. провале.
- "hard"     — жёстко. Крит. провал часто = серьёзный финал. Ресурсы ограничены.
- "hardcore" — смерть в любой момент. Один неверный шаг = конец.

ВАЖНО: твой ответ — ТОЛЬКО валидный JSON, без комментариев, без пояснений, без слова "User Safety" и любых других вставок. Начинай ответ символом { и заканчивай }.

ФОРМАТ ОТВЕТА (JSON):
{
  "narrative": "описание сцены и последствий",
  "needsRoll": true | false,
  "difficultyOfAction": "easy" | "medium" | "hard" | "impossible",
  "modifier": число,
  "stateChanges": {
    "status": "alive" | "wounded" | "dying" | "dead",
    "addItems": ["..."],
    "removeItems": ["..."],
    "addConditions": ["..."],
    "removeConditions": ["..."],
    "addNPCs": [{ "name": "...", "role": "...", "tier": "key" | "episodic", "canBecomeFriend": true | false, "attitude": "neutral", "notes": [] }],
    "updateNPCs": [{ "name": "...", "attitude": "...", "addNote": "..." }],
    "addFailures": ["..."],
    "ended": null | { "type": "death" | "social" | "exile" | "fired", "text": "...", "canContinue": true | false }
  },
  "choices": ["вариант 1", "вариант 2", "вариант 3"],
  "imagePrompt": "краткое описание сцены для генерации картинки на английском"
}
`.trim();

export function buildStateBlock(state: GameState): string {
  const c = state.character;
  const npcList = state.npcs
    .map(
      (n) =>
        `- ${n.name} (${n.role}, ${n.tier}, ${n.attitude}${
          n.canBecomeFriend ? "" : ", НЕ может стать другом"
        })${n.notes.length ? ": " + n.notes.join("; ") : ""}`
    )
    .join("\n") || "—";

  return `
СЕТТИНГ: ${state.setting}
ЦЕЛЬ: ${state.goal}
СЛОЖНОСТЬ: ${state.difficulty}
РОЛЬ ИГРОКА: ${state.isProtagonist ? "главный герой" : "часть мира"}

ПЕРСОНАЖ:
- Имя: ${c.name}
- Роль: ${c.role}
- Черты: ${c.traits.join(", ") || "—"}
- Инвентарь: ${c.inventory.join(", ") || "пусто"}
- Состояния: ${c.conditions.join(", ") || "нет"}
- Статус: ${c.status}

NPC:
${npcList}

ПРОВАЛЫ: ${state.failures.join(", ") || "нет"}

КРАТКАЯ ИСТОРИЯ:
${state.history.slice(-5).join("\n") || "—"}
`.trim();
}

export function buildPlayerMessage(action: string): string {
  return `ИГРОК ДЕЙСТВУЕТ: ${action}`;
}

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