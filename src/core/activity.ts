import type { InternalState } from "./internalState";
import { journalClock } from "./clock";
import { readStored, writeStored } from "./persistence";
import { isRecord } from "./validation";

export const ACTIVITY_LABELS = { idle: "Ready to chat", resting: "Resting", sleeping: "Sleeping", chatting: "Chatting", initiating: "Starting a conversation", waiting: "Waiting for your reply", reflecting: "Reflecting", journaling: "Writing a daily journal", working:"Writing a text contribution" } as const;
export type ActivityKind = keyof typeof ACTIVITY_LABELS;
export interface Activity { kind: ActivityKind; since: string }
export interface ActivityInputs { state: InternalState; timeZone: string; chatting: boolean; initiating: boolean; reflecting: boolean; journaling: boolean; waiting: boolean; previous?: ActivityKind; working?:boolean }
export function chooseActivity(input: ActivityInputs, now = new Date()): ActivityKind {
  if (input.journaling) return "journaling";
  if (input.working) return "working";
  if (input.reflecting) return "reflecting";
  if (input.initiating) return "initiating";
  if (input.chatting) return "chatting";
  if (input.waiting) return "waiting";
  const hour = Number(journalClock(now, input.timeZone).time.slice(0, 2));
  if (input.previous === "sleeping" && (hour >= 22 || hour < 8) && input.state.energy < 70) return "sleeping";
  if ((hour >= 22 || hour < 8) && input.state.energy < 35) return "sleeping";
  if (input.previous === "resting" && input.state.energy < 55) return "resting";
  if (input.state.energy < 40) return "resting";
  return "idle";
}
export function validateActivity(value: unknown, now = new Date()): Activity {
  if (isRecord(value) && typeof value.kind === "string" && Object.prototype.hasOwnProperty.call(ACTIVITY_LABELS, value.kind) && typeof value.since === "string" && Number.isFinite(Date.parse(value.since)) && Date.parse(value.since) <= now.getTime()) {
    return { kind: value.kind as ActivityKind, since: value.since };
  }
  return { kind: "idle", since: now.toISOString() };
}
export function loadActivity(): Activity { try { return validateActivity(JSON.parse(readStored("mana.activity.v1") ?? "null")); } catch { return validateActivity(null); } }
export const saveActivity = (activity: Activity) => writeStored("mana.activity.v1", JSON.stringify(activity));
export function activityContext(kind: ActivityKind): string {
  return `\n\nCURRENT APPLICATION ACTIVITY: ${ACTIVITY_LABELS[kind]}.
This is a simulated companion mode, not evidence of real-world actions or an activity history. Sleeping and resting restore simulated energy faster while the app runs; they do not run autonomous projects. Chat can interrupt rest or sleep immediately. Do not claim you worked, played, thought through a project, or performed activities while the app was closed. No offline activity log exists. Respond to the user's message rather than announcing mode changes.`;
}
