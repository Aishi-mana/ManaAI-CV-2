export const EMOTIONS = ["happy", "sad", "excited", "worried", "thinking", "surprised", "embarrassed", "sleepy", "neutral"] as const;

export const REPLY_FORMAT_RULES = `Reply formatting:
- Write only your reply, without a speaker label or a name followed by a colon.
- Use exactly one emotion tag, at the very end of the whole reply. Never put emotion tags inside sentences or between paragraphs.`;

const TAGS = [...EMOTIONS, "curious"];
const emotionPattern = new RegExp(`\\[\\s*(${TAGS.join("|")})\\s*\\]`, "gi");

/**
 * Turns raw model output into display text + emotion.
 * - removes <think>...</think> blocks (reasoning models)
 * - removes repeated leading character labels
 * - removes known emotion tags anywhere, using the last one for the avatar
 * - hides an unfinished known emotion tag during streaming
 */
export function cleanReply(raw: string, charName = "Mana"): { text: string; emotion: string | null } {
  let t = raw.replace(/<think>[\s\S]*?<\/think>/gi, "").replace(/<think>[\s\S]*$/i, "");
  let emotion: string | null = null;

  const name = charName.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  if (name) {
    t = t.replace(new RegExp(`^(?:\\s*${name}\\s*[:：]\\s*)+`, "i"), "");
  }
  t = t.replace(emotionPattern, (_, tag: string) => {
    emotion = tag.toLowerCase() === "curious" ? "thinking" : tag.toLowerCase();
    return "";
  });
  const unfinished = t.match(/\[\s*([a-zA-Z]*)\s*$/);
  if (unfinished && TAGS.some((e) => e.startsWith(unfinished[1].toLowerCase()))) {
    t = t.slice(0, unfinished.index);
  }
  t = t.replace(/[ \t]+$/gm, "");

  return { text: t.trim(), emotion };
}
