import { cookies } from "next/headers";
import {
  CHAT_FALLBACK_REPLY,
  CHAT_MODEL,
  SYSTEM_INSTRUCTION,
} from "@/lib/chat-knowledge";
import {
  addMessage,
  conversationExists,
  createConversation,
  getRecentMessages,
  isValidConversationId,
  type StoredMessage,
} from "@/lib/chat-store";

const COOKIE_NAME = "chat_cid";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30;
const MAX_CHARS = 500;
const CONTEXT_TURNS = 20;

const BUSY_ERROR = "Trợ lý đang bận, bạn thử lại sau ít phút nhé.";

// Cookie httpOnly chỉ chứa mã cuộc trò chuyện ngẫu nhiên (uuid), không chứa nội dung chat.
// Toàn bộ tin nhắn nằm trong Supabase và chỉ được đọc/ghi từ server này.
async function setConversationCookie(id: string) {
  (await cookies()).set(COOKIE_NAME, id, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: COOKIE_MAX_AGE,
  });
}

// Gemini cần lượt đầu là của người dùng và các lượt xen kẽ nhau.
function toGeminiContents(history: StoredMessage[]) {
  const contents: { role: string; parts: { text: string }[] }[] = [];
  for (const m of history) {
    const last = contents[contents.length - 1];
    if (last && last.role === m.role) {
      last.parts[0].text += `\n${m.content}`;
    } else {
      contents.push({ role: m.role, parts: [{ text: m.content }] });
    }
  }
  while (contents.length && contents[0].role !== "user") contents.shift();
  return contents;
}

export async function GET() {
  const id = (await cookies()).get(COOKIE_NAME)?.value;
  if (!isValidConversationId(id)) return Response.json({ messages: [] });

  try {
    const messages = await getRecentMessages(id);
    return Response.json({
      messages: messages.map((m) => ({ role: m.role, text: m.content })),
    });
  } catch (err) {
    console.error("Load chat history failed", err);
    return Response.json({ error: BUSY_ERROR }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return Response.json({ error: "Chatbot chưa được cấu hình." }, { status: 500 });
  }

  let text: string;
  try {
    const body = (await request.json()) as { text?: unknown };
    if (typeof body.text !== "string") throw new Error("bad text");
    text = body.text.trim().slice(0, MAX_CHARS);
  } catch {
    return Response.json({ error: "Dữ liệu không hợp lệ." }, { status: 400 });
  }
  if (!text) return Response.json({ error: "Dữ liệu không hợp lệ." }, { status: 400 });

  let conversationId: string;
  let history: StoredMessage[];
  try {
    const cookieId = (await cookies()).get(COOKIE_NAME)?.value;
    if (isValidConversationId(cookieId) && (await conversationExists(cookieId))) {
      conversationId = cookieId;
    } else {
      conversationId = await createConversation();
      await setConversationCookie(conversationId);
    }

    await addMessage(conversationId, "user", text);
    history = await getRecentMessages(conversationId, CONTEXT_TURNS);
  } catch (err) {
    console.error("Chat storage failed", err);
    return Response.json({ error: BUSY_ERROR }, { status: 500 });
  }

  let reply: string;
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
          contents: toGeminiContents(history),
          generationConfig: { temperature: 0.2, maxOutputTokens: 600 },
        }),
        signal: AbortSignal.timeout(20_000),
      },
    );

    if (!res.ok) {
      console.error("Gemini API error", res.status, await res.text());
      return Response.json({ error: BUSY_ERROR }, { status: 502 });
    }

    const data = (await res.json()) as {
      candidates?: { content?: { parts?: { text?: string }[] } }[];
    };
    reply =
      data.candidates?.[0]?.content?.parts
        ?.map((p) => p.text ?? "")
        .join("")
        .trim() || CHAT_FALLBACK_REPLY;
  } catch (err) {
    console.error("Gemini request failed", err);
    return Response.json({ error: BUSY_ERROR }, { status: 502 });
  }

  try {
    await addMessage(conversationId, "model", reply);
  } catch (err) {
    console.error("Saving bot reply failed", err);
    return Response.json({ error: BUSY_ERROR }, { status: 500 });
  }

  return Response.json({ reply });
}
