import type { Msg } from "./types";
import type { Memory } from "./character";
import { readStored, writeStored } from "./persistence";
import { stringList } from "./validation";
import { cleanReply } from "./emotion";

export interface MemorySuggestion {
  id: string;
  sourceId: string;
  sourceText: string;
  content: string;
  category: "user" | "mana";
  replaceId?: string;
}
const normalize = (text: string) => text.toLowerCase().replace(/favourite/g, "favorite").replace(/[.!]+$/, "").replace(/\s+/g, " ").trim();
function fact(sentence: string): string | null {
  const text = sentence.trim().replace(/^(?:actually[, ]+|remember (?:that )?)/i, "");
  // Conservative extraction: direct user statements only, never questions or hypothetical claims.
  if (/[?？]/.test(text) || /\b(?:if|maybe|might|perhaps|pretend|imagine|not|don't|do not|used to)\b/i.test(text) || text.length > 1000) return null;
  const favorite = text.match(/^my favou?rite ([\p{L}\p{N} -]{1,60}) is (.+)$/iu);
  if (favorite) return `Favorite ${favorite[1].trim()} is ${favorite[2].replace(/[.!]+$/, "").trim()}.`;
  const preference = text.match(/^I (like|love|enjoy|prefer) (.+)$/i);
  if (preference) return `${({ like: "Likes", love: "Loves", enjoy: "Enjoys", prefer: "Prefers" } as Record<string, string>)[preference[1].toLowerCase()]} ${preference[2].replace(/[.!]+$/, "").trim()}.`;
  const work = text.match(/^I work as (.+)$/i);
  if (work) return `Works as ${work[1].replace(/[.!]+$/, "").trim()}.`;
  return null;
}

function topic(content: string): string | null {
  return normalize(content).match(/^favorite (.+?) is /)?.[1] ?? null;
}

export function suggestMemories(messages: Msg[], memories: Memory[], reviewed: string[], charName?: string): MemorySuggestion[] {
  const result: MemorySuggestion[] = [];
  const seen = new Set(memories.map((m) => `${m.category}:${normalize(m.content)}`));
  const skipped = new Set(reviewed);
  const seenTopics = new Set<string>();
  for (const message of [...messages].reverse()) {
    if (message.error || (message.role !== "user" && !charName)) continue;
    const category=message.role==="user"?"user":"mana";
    const text=category==="mana"?cleanReply(message.content,charName).text:message.content;
    // Model suggestions are preferences only, not invented jobs, events or activities.
    const sentences = text.split(/\n|(?<=[.!])\s+/u);
    for (let index = 0; index < sentences.length; index++) {
      const content = fact(sentences[index]);
      if (!content) continue;
      if(category==="mana"&&!/^(?:Favorite |Likes |Loves |Enjoys |Prefers )/.test(content))continue;
      const key = `${category}:${normalize(content)}`;
      const id = `${message.id}:${index}`;
      // Newer statements about the same preference win in the review queue.
      const subject = topic(content)?`${category}:${topic(content)}`:null;
      if (subject && seenTopics.has(subject)) continue;
      if (subject) seenTopics.add(subject);
      const duplicate = seen.has(key);
      seen.add(key);
      if (skipped.has(id) || duplicate) continue;
      const existing = topic(content) ? memories.find((m) => m.category === category && topic(m.content) === topic(content)) : undefined;
      result.push({ id, sourceId: message.id, sourceText: text, content, category, replaceId: existing?.id });
      if (result.length >= 20) return result;
    }
  }
  return result;
}

export function loadMemoryReviews(): string[] {
  try { return stringList(JSON.parse(readStored("mana.memory_reviews.v1") ?? "[]")); } catch { return []; }
}
export const saveMemoryReviews = (ids: string[]) => writeStored("mana.memory_reviews.v1", JSON.stringify(stringList(ids)));
