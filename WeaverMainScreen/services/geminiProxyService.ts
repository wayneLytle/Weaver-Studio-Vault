const API_BASE = (import.meta as any).env?.VITE_API_BASE_URL || "http://localhost:4101";

export type ChatMessage = { role: "system" | "user" | "assistant"; content: string };

export async function chatWithGemini(input: {
  messages: ChatMessage[];
  model?: string;
  temperature?: number;
  maxTokens?: number;
  projectId?: string;
  location?: string;
}): Promise<string> {
  const res = await fetch(`${API_BASE}/v1/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ engine: 'gemini', ...input }),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Gemini proxy error ${res.status}: ${text || res.statusText}`);
  }
  const payload = await res.json();
  if (payload?.modelUsed) console.log(`[geminiService] modelUsed: ${payload.modelUsed}`);
  const content = payload?.content ?? "";
  return content;
}
