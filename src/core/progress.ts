// Progress tracking and unlock rules. No imports from the avatar code, so there are no cycles.
import { integerInRange, isRecord, nonEmptyString, safeKey, stringList, validDate } from "./validation";
import { readStored, writeStored } from "./persistence";

export type Rule =
  | { type: "invalid" }
  | { type: "days"; value: number }
  | { type: "messages"; value: number }
  | { type: "skill"; value: number }
  | { type: "milestone"; id: string }
  | { type: "season"; months: number[] };

export interface ItemInfo {
  name?: string;
  tags?: string[];
  /** One rule, or a list of rules that must ALL be met. No rule = available from the start. */
  unlock?: Rule | Rule[];
}
/** items.json: item id ("outfits/summer", "accessories/glasses", ...) -> info */
export type ItemCatalog = Record<string, ItemInfo>;

export interface Stats {
  firstChat: string | null;
  /** distinct local dates (YYYY-MM-DD) on which you sent a message */
  days: string[];
  messages: number;
  /** Mana's coding level. Nothing raises it yet; it arrives with her learning features. */
  skill: number;
  /** named achievements -> date earned */
  milestones: Record<string, string>;
}

export const EMPTY_STATS: Stats = { firstChat: null, days: [], messages: 0, skill: 0, milestones: {} };
const STATS_KEY = "mana.stats.v1";

export function validateStats(value: unknown): Stats {
  const result: Stats = { firstChat: null, days: [], messages: 0, skill: 0, milestones: {} };
  if (!isRecord(value)) return result;
  if (validDate(value.firstChat)) result.firstChat = value.firstChat;
  result.days = stringList(value.days).filter(validDate);
  if (integerInRange(value.messages, 0)) result.messages = value.messages;
  if (integerInRange(value.skill, 0)) result.skill = value.skill;
  if (isRecord(value.milestones)) {
    for (const [id, date] of Object.entries(value.milestones)) {
      if (nonEmptyString(id) && safeKey(id) && validDate(date)) result.milestones[id] = date;
    }
  }
  return result;
}

function validateRule(value: unknown): Rule | null {
  if (!isRecord(value)) return null;
  switch (value.type) {
    case "days": case "messages": case "skill":
      return integerInRange(value.value, 0) ? { type: value.type, value: value.value } : null;
    case "milestone":
      return nonEmptyString(value.id) && safeKey(value.id) ? { type: "milestone", id: value.id } : null;
    case "season":
      return Array.isArray(value.months) && value.months.length > 0 && value.months.every((month) => integerInRange(month, 1, 12))
        ? { type: "season", months: [...new Set<number>(value.months)] } : null;
    default: return null;
  }
}

/** Preserve valid metadata, but invalid unlock rules always stay locked. */
export function validateCatalog(value: unknown): { items: ItemCatalog; errors: string[] } {
  const items: ItemCatalog = Object.create(null);
  const errors: string[] = [];
  if (!isRecord(value)) return { items, errors: ["items.json must be an object of item IDs and metadata"] };
  for (const [id, entry] of Object.entries(value)) {
    if (!/^(base|outfits|hairstyles|accessories)\/[^/\\]+$/.test(id)) {
      errors.push(`Invalid item ID: ${id}`);
      continue;
    }
    if (!isRecord(entry)) {
      items[id] = { unlock: { type: "invalid" } };
      errors.push(`${id}: metadata must be an object`);
      continue;
    }
    const item: ItemInfo = {};
    if (entry.name !== undefined) {
      if (nonEmptyString(entry.name)) item.name = entry.name;
      else errors.push(`${id}: name must be a non-empty string`);
    }
    if (entry.tags !== undefined) {
      item.tags = stringList(entry.tags);
      if (!Array.isArray(entry.tags) || !entry.tags.every(nonEmptyString)) errors.push(`${id}: tags must be strings`);
    }
    if (Object.prototype.hasOwnProperty.call(entry, "unlock")) {
      const rules = Array.isArray(entry.unlock) ? entry.unlock : [entry.unlock];
      const validated = rules.map(validateRule);
      if (validated.some((rule) => rule === null)) {
        item.unlock = { type: "invalid" };
        errors.push(`${id}: invalid unlock rule (item stays locked)`);
      } else {
        item.unlock = validated as Rule[];
      }
    }
    items[id] = item;
  }
  return { items, errors };
}

export function loadStats(): Stats {
  try {
    const raw = readStored(STATS_KEY);
    if (raw) return validateStats(JSON.parse(raw));
  } catch {
    /* ignore */
  }
  return validateStats(null);
}

export function saveStats(s: Stats) {
  try {
    writeStored(STATS_KEY, JSON.stringify(validateStats(s)));
  } catch {
    /* ignore */
  }
}

const dayKey = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

/** Call when you send a message. */
export function bumpMessage(s: Stats, now: Date = new Date()): Stats {
  const day = dayKey(now);
  return {
    ...s,
    firstChat: s.firstChat ?? day,
    days: s.days.includes(day) ? s.days : [...s.days, day],
    messages: s.messages + 1,
    milestones: s.milestones.first_chat ? s.milestones : { ...s.milestones, first_chat: day },
  };
}

/** Other features call this to grant a named milestone (first diary entry, first game...). */
export function grantMilestone(id: string, now: Date = new Date()) {
  return (s: Stats): Stats => (s.milestones[id] ? s : { ...s, milestones: { ...s.milestones, [id]: dayKey(now) } });
}

export function ruleMet(rule: Rule, s: Stats, now: Date): boolean {
  switch (rule.type) {
    case "days":
      return s.days.length >= rule.value;
    case "messages":
      return s.messages >= rule.value;
    case "skill":
      return s.skill >= rule.value;
    case "milestone":
      return Object.prototype.hasOwnProperty.call(s.milestones, rule.id);
    case "season":
      return rule.months.includes(now.getMonth() + 1);
    default:
      return false; // unknown rule type: stays locked
  }
}

const asList = (u: ItemInfo["unlock"]): Rule[] => (!u ? [] : Array.isArray(u) ? u : [u]);

/** Defaults ("<slot>/default") are ALWAYS unlocked, whatever items.json says. */
export function isUnlocked(id: string, items: ItemCatalog, s: Stats, now: Date): boolean {
  if (id.endsWith("/default")) return true;
  return asList(items[id]?.unlock).every((r) => ruleMet(r, s, now));
}

/** Items whose rules became met between two stat snapshots (only ids that really exist). */
export function newlyUnlocked(items: ItemCatalog, known: Set<string>, before: Stats, after: Stats, now: Date): string[] {
  return Object.keys(items).filter(
    (id) => known.has(id) && !isUnlocked(id, items, before, now) && isUnlocked(id, items, after, now),
  );
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function describeRule(r: Rule, s: Stats, who: string): string {
  switch (r.type) {
    case "days":
      return `Chat on ${r.value} ${r.value === 1 ? "day" : "different days"} (${Math.min(s.days.length, r.value)}/${r.value})`;
    case "messages":
      return `Send ${r.value} ${r.value === 1 ? "message" : "messages"} (${Math.min(s.messages, r.value)}/${r.value})`;
    case "skill":
      return `${who} reaches coding level ${r.value} (not available yet)`;
    case "milestone": {
      const names: Record<string, string> = {
        first_chat: "Say your first hello",
        first_diary: `${who} writes her first diary entry`,
        first_game: `${who} makes her first game`,
      };
      return names[r.id] ?? `Reach the "${r.id}" milestone`;
    }
    case "season":
      return `Only in ${r.months.map((m) => MONTHS[(m - 1) % 12]).join(", ")}`;
    default:
      return "Fix this item's invalid unlock rule in items.json";
  }
}

/** What is still missing for an item, as one short line. */
export function hintFor(id: string, items: ItemCatalog, s: Stats, now: Date, who: string): string {
  const unmet = asList(items[id]?.unlock).filter((r) => !ruleMet(r, s, now));
  return unmet.map((r) => describeRule(r, s, who)).join(" and ");
}
