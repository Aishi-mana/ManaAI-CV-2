import type { ChatMessage, Msg } from "./types";
import { cleanReply, REPLY_FORMAT_RULES } from "./emotion";
import { ACTIVITY_GROUNDING } from "./conversation";

export type Health = "ok" | "loading" | "down";
const normalize = (text: string) => text.toLowerCase().replace(/[\s\p{P}\p{S}]+/gu, "");
export function echoedChatReply(reply: string, history: Msg[], charName = "Mana"): boolean {
  const text = cleanReply(reply, charName).text;
  const user = [...history].reverse().find((m) => m.role === "user")?.content ?? "";
  if (text.length < 40 || /\b(repeat|quote|verbatim|say it again)\b/i.test(user)) return false;
  const recent = history.filter(m=>!m.error).slice(-8);
  for (let i = recent.length - 1; i >= 0; i--) {
    if (recent[i].role !== "assistant" || normalize(cleanReply(recent[i].content, charName).text) !== normalize(text)) continue;
    const previousUser = recent.slice(0, i).reverse().find((m) => m.role === "user");
    // Repeating a factual answer to the same question is legitimate.
    if (previousUser && normalize(previousUser.content) === normalize(user)) return false;
    return true;
  }
  return false;
}

export async function checkHealth(port: number): Promise<Health> {
  try {
    const r = await fetch(`http://127.0.0.1:${port}/health`, { signal: AbortSignal.timeout(5000) });
    if (r.ok) return "ok";
    if (r.status === 503) return "loading";
    return "down";
  } catch {
    return "down";
  }
}

/**
 * Builds the message list for the model:
 * system prompt + the most recent turns, starting on a user turn and with
 * same-role neighbours merged (some chat templates reject anything else).
 */
export function buildPayload(system: string, history: Msg[], maxMessages = 24, charName = "Mana", currentContext = "", replyStyle = ""): ChatMessage[] {
  const cleaned = history.filter(m=>!m.error).map((m) => {
    if (m.role !== "assistant") return m;
    const reply = cleanReply(m.content, charName);
    return { ...m, content: reply.text ? reply.text + (reply.emotion ? ` [${reply.emotion}]` : "") : "" };
  }).filter((m) => m.content.trim()).slice(-maxMessages);
  const seen = new Set<string>();
  const recent = cleaned.filter((m, index) => {
    if (m.role !== "assistant") return true;
    const text = cleanReply(m.content, charName).text;
    if (text.length < 40) return true;
    const key = normalize(text);
    // Drop stale copies only; keep the latest occurrence in the model context.
    if (cleaned.slice(index + 1).some((later) => later.role === "assistant" && normalize(cleanReply(later.content, charName).text) === key)) return false;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  while (recent.length && recent[0].role !== "user") recent.shift();

  const merged: ChatMessage[] = [];
  for (const m of recent) {
    const last = merged[merged.length - 1];
    if (last && last.role === m.role) last.content += "\n" + m.content;
    else merged.push({ role: m.role, content: m.content });
  }
  const formatted = system.includes(REPLY_FORMAT_RULES) ? system : `${system}\n\n${REPLY_FORMAT_RULES}`;
  const prompt = `${formatted}\n\n${ACTIVITY_GROUNDING}`;
  const latest = merged[merged.length - 1];
  if (currentContext && latest?.role === "user") {
    latest.content += `\n\n[Application context for this reply; these are the current saved facts, overriding old assistant guesses.]\n${currentContext}\n\nRespond to the user's latest message above using these current facts. If they answered your question, acknowledge their answer and continue; do not repeat your previous opening or question. Do not repeat unsupported earlier assistant claims. ${REPLY_FORMAT_RULES}`;
  }
  if (latest?.role === "user") latest.content += `\n\n[Current application capabilities and grounding rules]\n${ACTIVITY_GROUNDING}`;
  if (latest?.role === "user" && replyStyle) latest.content += `\n\n${replyStyle}`;
  return [{ role: "system", content: prompt }, ...merged];
}

/** Remove older conversation only; never slice current evidence or the latest request. */
export function compactRequestHistory(messages:ChatMessage[]):ChatMessage[]|null{
 const system=messages.filter(m=>m.role==='system'),conversation=messages.filter(m=>m.role!=='system');
 if(conversation.length<=1)return null;
 let start=Math.max(1,Math.floor(conversation.length/2));
 while(start<conversation.length-1&&conversation[start].role!=='user')start++;
 const recent=conversation.slice(start);
 return [...system,...recent];
}

export async function streamChat(opts: {
  port: number;
  messages: ChatMessage[];
  temperature: number;
  signal?: AbortSignal;
  onToken: (token: string) => void;
}): Promise<void> {
  let messages=opts.messages;
  let res:Response;
  for(let attempt=0;;attempt++){
  res = await fetch(`http://127.0.0.1:${opts.port}/v1/chat/completions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    signal: opts.signal,
    body: JSON.stringify({
      messages,
      stream: true,
      temperature: opts.temperature,
      max_tokens: 700,
      cache_prompt: true,
      // Ignored by models without a thinking mode; turns it off for Qwen3-style ones.
      chat_template_kwargs: { enable_thinking: false },
    }),
  });

  if (!res.ok || !res.body) {
    const text = await res.text().catch(() => "");
    let overflow=false;
    try{overflow=res.status===400&&JSON.parse(text)?.error?.type==='exceed_context_size_error';}catch{/* Other errors must not trigger a retry. */}
    if(overflow){
      const compact=compactRequestHistory(messages);
      if(attempt<2&&compact&&!opts.signal?.aborted){messages=compact;continue;}
      throw new Error('The current request exceeds the model context limit, even after reducing older conversation. Saved chat is unchanged. Shorten the message or reduce the selected context.');
    }
    throw new Error(`Server error ${res.status}: ${text.slice(0, 300)}`);
  }
  break;
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let finished = false;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    let nl: number;
    while ((nl = buffer.indexOf("\n")) >= 0) {
      const line = buffer.slice(0, nl).trim();
      buffer = buffer.slice(nl + 1);
      if (!line.startsWith("data:")) continue;
      const data = line.slice(5).trim();
      if (data === "[DONE]") return;
      try {
        const json = JSON.parse(data);
        if (json.choices?.[0]?.finish_reason != null) finished = true;
        const delta = json.choices?.[0]?.delta?.content;
        if (typeof delta === "string" && delta) opts.onToken(delta);
      } catch {
        /* ignore a malformed chunk */
      }
    }
  }
  if (!finished) throw new Error("The response stream ended before the model finished replying.");
}
