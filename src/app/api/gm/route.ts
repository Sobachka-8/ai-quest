// src/app/api/gm/route.ts

import { NextRequest, NextResponse } from "next/server";
import {
  SYSTEM_PROMPT,
  buildStateBlock,
  buildPlayerMessage,
  type GameState,
} from "@/lib/prompt";

export async function POST(req: NextRequest) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "OPENROUTER_API_KEY не задан" },
      { status: 500 }
    );
  }

  let body: { state: GameState; action: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Bad JSON" }, { status: 400 });
  }

  const { state, action } = body;

  const userMessage = `${buildStateBlock(state)}\n\n${buildPlayerMessage(action)}`;

  try {
    const resp = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://ai-quest-tawny.vercel.app",
        "X-Title": "AI Quest",
      },
      body: JSON.stringify({
        model: "openrouter/free", 
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userMessage },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (!resp.ok) {
      const text = await resp.text();
      return NextResponse.json(
        { error: "OpenRouter error", detail: text },
        { status: 502 }
      );
    }

    const data = await resp.json();
    const content = data?.choices?.[0]?.message?.content;

    if (!content) {
      return NextResponse.json(
        { error: "Пустой ответ от AI" },
        { status: 502 }
      );
    }

// AI должен вернуть JSON, но иногда оборачивает в ```json
// или присылает мусор. Пытаемся распарсить, а если не вышло — отдаём как текст.
const cleaned = content
  .replace(/```json\s*/g, "")
    .replace(/```\s*/g, "")
      .trim();

      let parsed: any;
      try {
        parsed = JSON.parse(cleaned);
        } catch {
          parsed = {
              narrative: cleaned || "(модель вернула пустой ответ)",
                  needsRoll: false,
                      choices: [],
                        };
                        }

                        return NextResponse.json({ ok: true, result: parsed });
  } catch (err) {
    return NextResponse.json(
      { error: "Server error", detail: String(err) },
      { status: 500 }
    );
  }
}