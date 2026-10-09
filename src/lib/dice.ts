// src/lib/dice.ts

export type Difficulty = "light" | "normal" | "hard" | "hardcore";

export type CheckResult = {
  d1: number;
  d2: number;
  total: number;
  modifier: number;
  final: number;
  outcome: "critical_success" | "success" | "partial" | "fail" | "critical_fail";
  verdict: string;
};

// Бросок одного кубика 1..9
function rollD9(): number {
  return Math.floor(Math.random() * 9) + 1;
}

// Бросок 2D9 + модификатор
// modifier — сумма бонусов/штрафов (навыки, состояния, ситуация)
export function rollCheck(modifier = 0): CheckResult {
  const d1 = rollD9();
  const d2 = rollD9();
  const total = d1 + d2;
  const final = total + modifier;

  let outcome: CheckResult["outcome"];
  let verdict: string;

  if (d1 === 9 && d2 === 9) {
    outcome = "critical_success";
    verdict = "🔥 Критический успех! Двойная 9.";
  } else if (d1 === 1 && d2 === 1) {
    outcome = "critical_fail";
    verdict = "💀 Критический провал! Двойная 1.";
  } else if (final >= 15) {
    outcome = "success";
    verdict = "✅ Успех.";
  } else if (final >= 10) {
    outcome = "partial";
    verdict = "🤔 Частичный успех.";
  } else {
    outcome = "fail";
    verdict = "❌ Провал.";
  }

  return { d1, d2, total, modifier, final, outcome, verdict };
}

// Текстовое описание для лога
export function formatRoll(r: CheckResult): string {
  const modText =
    r.modifier === 0
      ? ""
      : r.modifier > 0
      ? ` + ${r.modifier}`
      : ` − ${Math.abs(r.modifier)}`;
  return `🎲 Броски: ${r.d1} + ${r.d2} = ${r.total}${modText} → ${r.final}. ${r.verdict}`;
}