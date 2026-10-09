import { readStored, writeStored } from "./persistence";
import { isRecord, stringList } from "./validation";

export interface Relationship {
  bond: number;
  affection: number;
  processedEvents: string[];
  lastChangedAt: string | null;
  lastChange: "conversation" | "initiativeReply" | "timeout" | null;
}
const clamp = (value: number) => Math.round(Math.max(0, Math.min(100, value)) * 100) / 100;
export function validateRelationship(value: unknown): Relationship {
  const state: Relationship = { bond: 30, affection: 50, processedEvents: [], lastChangedAt: null, lastChange: null };
  if (!isRecord(value)) return state;
  for (const key of ["bond", "affection"] as const) if (typeof value[key] === "number" && Number.isFinite(value[key])) state[key] = clamp(value[key]);
  state.processedEvents = [...new Set(stringList(value.processedEvents))];
  if (typeof value.lastChangedAt === "string" && Number.isFinite(Date.parse(value.lastChangedAt))) state.lastChangedAt = value.lastChangedAt;
  if (value.lastChange === "conversation" || value.lastChange === "initiativeReply" || value.lastChange === "timeout") state.lastChange = value.lastChange;
  return state;
}
export function loadRelationship(): Relationship {
  try { return validateRelationship(JSON.parse(readStored("mana.relationship.v1") ?? "null")); } catch { return validateRelationship(null); }
}
export const saveRelationship = (state: Relationship) => writeStored("mana.relationship.v1", JSON.stringify(validateRelationship(state)));
export function relationshipEvent(state: Relationship, id: string, kind: NonNullable<Relationship["lastChange"]>, now = new Date()): Relationship {
  if (!id.trim() || state.processedEvents.includes(id)) return state;
  const [bond, affection] = kind === "timeout" ? [-0.1, -0.5] : kind === "initiativeReply" ? [0.3, 1] : [0.2, 0.5];
  return { ...state, bond: clamp(state.bond + bond), affection: clamp(state.affection + affection),
    processedEvents: [...state.processedEvents, id], lastChangedAt: now.toISOString(), lastChange: kind };
}
export function relationshipContext(state: Relationship): string {
  return `\n\nCURRENT RELATIONSHIP STATE\nBond (long-term familiarity): ${state.bond}/100. Affection (current warmth): ${state.affection}/100.
These are fictional companion progression stats, not evidence of real feelings or a measure of the user's worth. Let familiarity gently inform tone while remaining kind at every level. Saved relationship identity stays authoritative. Do not demand attention, blame the user, mention lost points, or threaten consequences. Do not recite scores unless asked.`;
}
