import { EMOTIONS } from "./emotion";
import { readStored, writeStored } from "./persistence";
import { isRecord } from "./validation";

export type Mood = (typeof EMOTIONS)[number];
export type RecoveryMode = "idle" | "resting" | "sleeping";
export function recoveredEnergy(energy: number, hours: number, mode: RecoveryMode = "idle"): number {
  const rate = mode === "sleeping" ? 12 : mode === "resting" ? 8 : 2;
  const target = mode === "sleeping" ? 70 : mode === "resting" ? 55 : 100;
  const acceleratedHours = Math.min(hours, Math.max(0, target - energy) / rate);
  return clamp(energy + rate * acceleratedHours + 2 * (hours - acceleratedHours));
}
export interface InternalState {
  mood: Mood;
  moodIntensity: number;
  energy: number;
  curiosity: number;
  socialNeed: number;
  lastUpdatedAt: string;
  lastConversationAt: string | null;
}
const clamp = (n: number, max = 100) => Math.max(0, Math.min(max, n));
const validTime = (v: unknown): v is string => typeof v === "string" && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(v)
  && Number.isFinite(Date.parse(v)) && new Date(v).toISOString() === v;
export function defaultInternalState(now = new Date()): InternalState {
  return { mood: "neutral", moodIntensity: 0, energy: 70, curiosity: 60, socialNeed: 20,
    lastUpdatedAt: now.toISOString(), lastConversationAt: null };
}
export function validateInternalState(value: unknown, now = new Date()): InternalState {
  const result = defaultInternalState(now);
  if (!isRecord(value)) return result;
  if (typeof value.mood === "string" && (EMOTIONS as readonly string[]).includes(value.mood)) result.mood = value.mood as Mood;
  for (const key of ["energy", "curiosity", "socialNeed", "moodIntensity"] as const) {
    if (typeof value[key] === "number" && Number.isFinite(value[key])) result[key] = clamp(value[key], key === "moodIntensity" ? 1 : 100);
  }
  if (validTime(value.lastUpdatedAt)) result.lastUpdatedAt = value.lastUpdatedAt;
  if (validTime(value.lastConversationAt)) result.lastConversationAt = value.lastConversationAt;
  if (result.mood === "neutral") result.moodIntensity = 0;
  return result;
}
/** Elapsed-time simulation, including time away; no continuous AI inference. */
export function advanceInternalState(state: InternalState, now = new Date(), recovery: RecoveryMode = "idle"): InternalState {
  const hours = Math.max(0, (now.getTime() - Date.parse(state.lastUpdatedAt)) / 3_600_000);
  if (!hours) return state;
  const intensity = state.moodIntensity * Math.pow(0.5, hours / 2);
  return { ...state, energy: recoveredEnergy(state.energy, hours, recovery), socialNeed: clamp(state.socialNeed + 3 * hours),
    curiosity: clamp(60 + (state.curiosity - 60) * Math.pow(0.5, hours / 12)),
    mood: intensity < 0.15 ? "neutral" : state.mood, moodIntensity: intensity < 0.15 ? 0 : intensity, lastUpdatedAt: now.toISOString() };
}
export function conversationState(state: InternalState, now = new Date()): InternalState {
  const current = advanceInternalState(state, now);
  return { ...current, energy: clamp(current.energy - 2), curiosity: clamp(current.curiosity + 2),
    socialNeed: clamp(current.socialNeed - 12), lastConversationAt: now.toISOString() };
}
export function replyState(state: InternalState, emotion: string | null, now = new Date()): InternalState {
  const current = advanceInternalState(state, now);
  if (!emotion || !(EMOTIONS as readonly string[]).includes(emotion)) return current;
  const mood = emotion as Mood;
  return { ...current, mood, moodIntensity: mood === "neutral" ? 0 : mood === current.mood ? Math.min(1, current.moodIntensity + 0.25) : 0.55 };
}
export const stateMood = (state: InternalState): Mood => state.energy < 20 ? "sleepy" : state.mood;
export function loadInternalState(now = new Date()): InternalState {
  try { return advanceInternalState(validateInternalState(JSON.parse(readStored("mana.internal_state.v1") ?? "null"), now), now); }
  catch { return defaultInternalState(now); }
}
export const saveInternalState = (state: InternalState) => writeStored("mana.internal_state.v1", JSON.stringify(validateInternalState(state)));
export function internalStateContext(state: InternalState): string {
  return `\n\nCURRENT COMPANION STATE
Mood: ${stateMood(state)}; energy: ${Math.round(state.energy)}/100; curiosity: ${Math.round(state.curiosity)}/100; social need: ${Math.round(state.socialNeed)}/100.
Let this gently influence your tone. Low energy can make you quieter; high curiosity can make you more interested in a topic. Respond to the user's feelings first.
Social need is an internal tendency to connect, not a request or obligation for the user. Never guilt them for being away or pressure them to stay.
Do not invent activities, memories, or events to explain these values. Do not recite these numbers unless the user asks. The saved identity and factual memory rules still apply.`;
}
