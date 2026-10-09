import type { Msg, ChatMessage } from "./types";
import type { DiaryEntry } from "./diary";
import { readStored, writeStored } from "./persistence";
import { isRecord, nonEmptyString, stringList, validDate } from "./validation";
import { journalClock, validTimeZone } from "./clock";
import { cleanReply } from "./emotion";
import type { Goal } from "./goals";
export { journalClock, validTimeZone } from "./clock";

export interface JournalSource { id: string; content: string; createdAt: string; date: string; role?: "user" | "assistant" }
export interface JournalState { enabled: boolean; time: string; timeZone: string; completedDates: string[]; sources: JournalSource[] }
export const validJournalTime = (v: unknown): v is string => typeof v === "string" && /^([01]\d|2[0-3]):[0-5]\d$/.test(v);
export function validateJournalState(value: unknown): JournalState {
  const result: JournalState = { enabled:true,time:"22:00",timeZone:"Asia/Singapore",completedDates:[],sources:[] };
  if (!isRecord(value)) return result;
  if (typeof value.enabled === "boolean") result.enabled = value.enabled;
  if (validJournalTime(value.time)) result.time = value.time;
  if (validTimeZone(value.timeZone)) result.timeZone = value.timeZone;
  result.completedDates = stringList(value.completedDates).filter(validDate);
  const ids = new Set<string>();
  if (Array.isArray(value.sources)) for (const source of value.sources) {
    if (!isRecord(source) || !nonEmptyString(source.id) || ids.has(source.id) || !nonEmptyString(source.content) || typeof source.createdAt !== "string" || !Number.isFinite(Date.parse(source.createdAt)) || !validDate(source.date)) continue;
    ids.add(source.id);
    result.sources.push({ id:source.id,content:source.content.slice(0,2000),createdAt:source.createdAt,date:source.date,role:source.role==="assistant"?"assistant":"user" });
  }
  return result;
}
export function loadJournalState(): JournalState { try { return validateJournalState(JSON.parse(readStored("mana.daily_journal.v1") ?? "null")); } catch { return validateJournalState(null); } }
export const saveJournalState = (state: JournalState) => writeStored("mana.daily_journal.v1",JSON.stringify(validateJournalState(state)));
export function recordJournalSource(state: JournalState, message: Msg, charName?: string): JournalState {
  if (message.error || (message.role !== "user" && !charName) || !message.createdAt || !Number.isFinite(Date.parse(message.createdAt)) || !message.content.trim() || state.sources.some((s) => s.id === message.id)) return state;
  const content=message.role==="assistant"?cleanReply(message.content,charName).text:message.content;
  if(!content.trim())return state;
  const date = journalClock(new Date(message.createdAt),state.timeZone).date;
  if (state.completedDates.includes(date)) return state;
  return { ...state,sources:[...state.sources,{ id:message.id,content:content.slice(0,2000),createdAt:message.createdAt,date,role:message.role }] };
}
export function dueJournalDate(state: JournalState, diary: DiaryEntry[], now = new Date()): string | null {
  if (!state.enabled) return null;
  const clock = journalClock(now,state.timeZone);
  const completed = new Set([...state.completedDates,...diary.flatMap((e) => e.journalDate ? [e.journalDate] : [])]);
  const pendingDates = [...new Set(state.sources.map((s) => s.date))].filter((date) => !completed.has(date) && (date < clock.date || date === clock.date && clock.time >= state.time)).sort();
  if (pendingDates.length) return pendingDates[0];
  return clock.time >= state.time && !completed.has(clock.date) ? clock.date : null;
}
export function journalMessages(state: JournalState, date: string): Msg[] {
  const sources = state.sources.filter((s) => s.date === date);
  // Sample the whole recorded day, rather than only its final conversation.
  const selected = sources.length <= 12 ? sources : Array.from({ length:12 },(_,i) => sources[Math.round(i*(sources.length-1)/11)]);
  return selected.map((s) => ({ id:s.id,role:s.role??"user",content:s.content.slice(0,1000),createdAt:s.createdAt }));
}
export function completeJournal(state: JournalState, date: string): JournalState {
  return { ...state,completedDates:[...new Set([...state.completedDates,date])],sources:state.sources.filter((s) => s.date !== date) };
}
export function dailyJournalPayload(payload: ChatMessage[], date: string, quiet: boolean, goals:Goal[] = [], timeZone="Asia/Singapore"): ChatMessage[] {
  const updates=goals.filter((g)=>journalClock(new Date(g.updatedAt),timeZone).date===date).slice(-4).map((g)=>({title:g.title,status:g.status,userRecordedProgress:g.notes.slice(0,700),updatedAt:g.updatedAt}));
  return [{ ...payload[0],content:payload[0].content + `\nWrite a daily journal entry for ${date} in your own voice. Include what was discussed, what it meant to you, and a modest hope for the next day. Saved preferences are background knowledge, not events that happened on this date. ${quiet ? "No user conversations were recorded for this date. Acknowledge a quiet day without claiming you performed activities while alone." : "The supplied conversation messages were recorded on this journal date. Ground the day's discussion in those messages; assistant statements are evidence of conversation only."} The current mood is your mood at writing time, not evidence of what you felt all day. Return the entry text only.` },
    { ...payload[1],content:payload[1].content.replace("These notes may be older; do not assume events occurred today or yesterday.",`The recorded conversation belongs to journal date ${date}; saved facts are background, not events.`)+`\nReflect on both speakers: what the user shared and what you replied, proposed or chose. Assistant claims establish only words spoken, not proof of physical actions, imagined scenes, code execution or completed work. Accepted preferences are character background; do not imply they were chosen that day without dated conversation evidence. Avoid a generic list of favorite foods when there is a real conversation to reflect on. Keep unfinished plans prospective.\nGoal snapshots last updated on this date (JSON evidence): ${JSON.stringify(updates)}. These are current saved snapshots, not a change history or proof every field changed that day. Only describe progress as user-recorded; do not invent steps or offline activities.` }];
}
