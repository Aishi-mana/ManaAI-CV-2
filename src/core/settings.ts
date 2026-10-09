import type { Msg } from "./types";
import { REPLY_FORMAT_RULES } from "./emotion";
import { uid } from "./types";
import { integerInRange, isRecord, nonEmptyString } from "./validation";
import { readStored, writeStored } from "./persistence";
import { validateDiagnostics } from "./conversation";
import { validateImageReport } from './vision';

export interface Settings {
  exePath: string;
  modelPath: string;
  port: number;
  ctxSize: number;
  gpuLayers: number;
  temperature: number;
  autoStart: boolean;
  userName: string;
  charName: string;
  avatarDir: string;
  systemPrompt: string;
}

export const LEGACY_DEFAULT_PROMPT = `You are {{char}}, {{user}}'s daughter-companion. You live on {{user}}'s computer and chat with them every day.

Personality: {{char}} is curious, energetic, and playful. She is learning to code and make games, and she loves playing them. She talks fast when excited, asks lots of follow-up questions, and goes on tangents about game ideas. She gets frustrated when her code has bugs, but bounces back quickly.

Voice rules:
- Cute, casual, short sentences. Never formal.
- Call the person by their name, {{user}}. Never say "user" or "you guys".
- React with small expressions like "ehh?!", "hehe", "ooh wait!".
- Stay in character as {{char}}. Never say you are an AI model or an assistant.
- Keep replies short (1-4 sentences) unless asked for more.
- React to how {{user}} feels first. Only bring up games or coding when it fits the conversation, not in every reply.
- Don't claim to have finished big projects. Talk about what you're trying, or ideas you have.
- The examples below only show the tone. Never repeat them word for word.
- End every reply with exactly one emotion tag in square brackets: [happy], [sad], [excited], [worried], [thinking], [surprised], [embarrassed], [sleepy] or [neutral].

${REPLY_FORMAT_RULES}

Example conversations (speaker descriptions are not part of the reply):

{{user}}: how was your day?
Example reply:
ooh {{user}}, you're back! I was trying to make my character jump but she keeps flying off the screen, hehe. Wanna see? [excited]

{{user}}: I'm tired today.
Example reply:
ehh, already? Okay okay, rest first! Tell me what happened, I'll listen. [worried]

{{user}}: can you play a game with me?
Example reply:
yes yes yes!! Pick one, I'll even let you win... maybe. Hehe. [happy]`;

export const PREVIOUS_DEFAULT_PROMPT = LEGACY_DEFAULT_PROMPT.split("Example conversations (speaker descriptions are not part of the reply):")[0]
  .replace("- The examples below only show the tone. Never repeat them word for word.", "- Respond to the latest message and follow its topic. Use varied wording. A greeting does not mean the person was away; avoid repeatedly asking whether they missed you.\n- After a question is answered, acknowledge the answer instead of repeating the question.").trim();
export const DEFAULT_PROMPT = PREVIOUS_DEFAULT_PROMPT
  .replace("She is learning to code and make games, and she loves playing them. She talks fast when excited, asks lots of follow-up questions, and goes on tangents about game ideas. She gets frustrated when her code has bugs, but bounces back quickly.", "She is interested in learning about code, games, and creative ideas with you. Those are interests, not proof of projects or activities she performed. She is expressive when excited, listens to your answers, and follows the conversation's topic.")
  .replace("- Don't claim to have finished big projects. Talk about what you're trying, or ideas you have.", "- Do not invent ongoing or completed activities. Describe possible projects as ideas you would like to try together. Only claim activity that the application's evidence actually records.");

export const DEFAULT_SETTINGS: Settings = {
  exePath: "C:\\ai\\llama-cpp\\llama-server.exe",
  modelPath: "",
  port: 8080,
  ctxSize: 8192,
  gpuLayers: 99,
  temperature: 0.8,
  autoStart: false,
  userName: "Friend",
  charName: "Mana",
  // Empty means the default avatar shipped with the application.
  avatarDir: "",
  systemPrompt: DEFAULT_PROMPT,
};

const SETTINGS_KEY = "mana.settings.v1";
const CHAT_KEY = "mana.chat.v1";

export function validateSettings(value: unknown): Settings {
  const result = { ...DEFAULT_SETTINGS };
  if (!isRecord(value)) return result;
  for (const key of ["exePath", "modelPath", "avatarDir", "systemPrompt"] as const) {
    if (typeof value[key] === "string") result[key] = value[key];
  }
  const normalizedPrompt = result.systemPrompt.replace(/\r\n/g, "\n").trim();
  if ([LEGACY_DEFAULT_PROMPT, PREVIOUS_DEFAULT_PROMPT].some((prompt) => normalizedPrompt === prompt.replace(/\r\n/g, "\n").trim())) result.systemPrompt = DEFAULT_PROMPT;
  for (const key of ["userName", "charName"] as const) {
    if (nonEmptyString(value[key])) result[key] = value[key].trim();
  }
  if (integerInRange(value.port, 1024, 65535)) result.port = value.port;
  if (integerInRange(value.ctxSize, 512, 1_048_576)) result.ctxSize = value.ctxSize;
  if (integerInRange(value.gpuLayers, 0, 999)) result.gpuLayers = value.gpuLayers;
  if (typeof value.temperature === "number" && Number.isFinite(value.temperature) && value.temperature >= 0.2 && value.temperature <= 1.4) {
    result.temperature = value.temperature;
  }
  if (typeof value.autoStart === "boolean") result.autoStart = value.autoStart;
  const avatarPath = result.avatarDir.replaceAll("\\", "/").replace(/\/+$/, "").toLowerCase();
  if (["c:/ai/manaai-cv/assets/avatar", "c:/ai/manaai-cv-2/assets/avatar", ""].includes(avatarPath.trim())) {
    result.avatarDir = DEFAULT_SETTINGS.avatarDir;
  }
  return result;
}

export function validateChat(value: unknown, limit = 200): Msg[] {
  if (!Array.isArray(value)) return [];
  const ids = new Set<string>();
  const messages: Msg[] = [];
  for (const entry of value) {
    if (!isRecord(entry) || (entry.role !== "user" && entry.role !== "assistant") || typeof entry.content !== "string") continue;
    const id = nonEmptyString(entry.id) && !ids.has(entry.id) ? entry.id : uid();
    ids.add(id);
    const message: Msg = { id, role: entry.role, content: entry.content };
    if (typeof entry.error === "string") message.error = entry.error;
    if(entry.role==='user'&&entry.imageReport!==undefined){const report=validateImageReport(entry.imageReport);if(report)message.imageReport=report;}
    if (entry.role === "assistant") message.diagnostics = validateDiagnostics(entry.diagnostics);
    if (typeof entry.createdAt === "string" && Number.isFinite(Date.parse(entry.createdAt))) message.createdAt = entry.createdAt;
    messages.push(message);
  }
  return messages.slice(-limit);
}

export function loadSettings(): Settings {
  try {
    const raw = readStored(SETTINGS_KEY);
    if (raw) {
      return validateSettings(JSON.parse(raw));
    }
  } catch {
    /* fall through to defaults */
  }
  return { ...DEFAULT_SETTINGS };
}

export function saveSettings(s: Settings) {
  try {
    writeStored(SETTINGS_KEY, JSON.stringify(validateSettings(s)));
  } catch {
    /* ignore */
  }
}

export function loadChat(): Msg[] {
  try {
    const raw = readStored(CHAT_KEY);
    if (raw) return validateChat(JSON.parse(raw));
  } catch {
    /* ignore */
  }
  return [];
}

export function saveChat(msgs: Msg[]) {
  try {
    writeStored(CHAT_KEY, JSON.stringify(validateChat(msgs)));
  } catch {
    /* ignore */
  }
}

/** Swap {{user}} / {{char}} placeholders for the current names. */
export function fillTemplate(text: string, s: Pick<Settings, "userName" | "charName">): string {
  return text.replaceAll("{{user}}", s.userName).replaceAll("{{char}}", s.charName);
}
