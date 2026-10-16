import {
  CHAT_FALLBACK_REPLY,
  CHAT_MODEL,
  SYSTEM_INSTRUCTION,
} from "@/lib/chat-knowledge";

const MAX_TURNS = 12;
const MAX_CHARS = 500;

interface ChatTurn {
  role: "user" | "model";
  text: string;
}

function parseTurns(body: unknown): ChatTurn[] | null {
  if (!body || typeof body !== "object") return null;
  const raw = (body as { messages?: unknown }).messages;
  if (!Array.isArray(raw)) return null;

  const turns: ChatTurn[] = [];
  for (const m of raw.slice(-MAX_TURNS)) {
    if (!m || typeof m !== "object") return null;
    const { role, text } = m as { role?: unknown; text?: unknown };
    if ((role !== "user" && role !== "model") || typeof text !== "string") return null;
    const trimmed = text.trim().slice(0, MAX_CHARS);
    if (trimmed) turns.push({ role, text: trimmed });
  }

  // Gemini cần lượt đầu là của người dùng và lượt cuối cũng là người dùng.
  while (turns.length && turns[0].role !== "user") turns.shift();
  if (!turns.length || turns[turns.length - 1].role !== "user") return null;
  return turns;
}

export async function POST(request: Request) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return Response.json({ error: "Chatbot chưa được cấu hình." }, { status: 500 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Dữ liệu không hợp lệ." }, { status: 400 });
  }

  const turns = parseTurns(body);
  if (!turns) {
    return Response.json({ error: "Dữ liệu không hợp lệ." }, { status: 400 });
  }

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${CHAT_MODEL}:generateContent`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey,
        },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: SYSTEM_INSTRUCTION }] },
          contents: turns.map((t) => ({ role: t.role, parts: [{ text: t.text }] })),
          generationConfig: { temperature: 0.2, maxOutputTokens: 600 },
        }),
        signal: AbortSignal.timeout(20_000),
      },
    );

    if (!res.ok) {
      console.error("Gemini API error", res.status, await res.text());
      return Response.json(
        { error: "Trợ lý đang bận, bạn thử lại sau ít phút nhé." },
        { status: 502 },
      );
    }

    const data = (await res.json()) as {
      candidates?: { content?: { parts?: { text?: string }[] } }[];
    };
    const reply = data.candidates?.[0]?.content?.parts
      ?.map((p) => p.text ?? "")
      .join("")
      .trim();

    return Response.json({ reply: reply || CHAT_FALLBACK_REPLY });
  } catch (err) {
    console.error("Gemini request failed", err);
    return Response.json(
      { error: "Trợ lý đang bận, bạn thử lại sau ít phút nhé." },
      { status: 502 },
    );
  }
}
