import { invoke } from "@tauri-apps/api/core";
import mapData from "./avatar-map.json";
import { validateCatalog } from "./progress";
import type { ItemCatalog } from "./progress";
import { isRecord, nonEmptyString, stringList } from "./validation";
import { readStored, writeStored } from "./persistence";

export type Vowel = "a" | "e" | "i" | "o" | "u";

export const EMOTION_MAP = mapData.emotions as Record<string, { eyes: string; mouth: string }>;
export const BLINK = mapData.blink as { half: string; closed: string };
export const VIEWS = mapData.views as Record<string, { label: string; scale: number; y: number }>;

/** Accessory depths, bottom to top. */
export const SLOTS = ["back", "behind-body", "behind-front-hair", "top"] as const;
export type AccessorySlot = (typeof SLOTS)[number];
const SLOT_OVERRIDE = (mapData.accessorySlots ?? {}) as Record<string, string>;
const isSlot = (s: string): s is AccessorySlot => (SLOTS as readonly string[]).includes(s);

export interface AvatarAssets {
  /** Relative paths with forward slashes, e.g. "eyes/eye_happy.png" */
  files: string[];
  /** lowercase relative path -> blob URL */
  urls: Map<string, string>;
  /** from items.json (names and unlock rules); empty if the file doesn't exist */
  items: ItemCatalog;
  itemsError?: string;
}

export interface AvatarConfig {
  skin: string;
  hairstyle: string;
  outfit: string;
  accessories: string[];
  view: string;
  looks?: SavedLook[];
}

export interface SavedLook {
  name: string;
  skin: string;
  hairstyle: string;
  outfit: string;
  accessories: string[];
}

export interface Accessory {
  name: string;
  rel: string;
  slot: AccessorySlot;
}

export interface AvatarOptions {
  skins: string[];
  hairstyles: string[];
  outfits: string[];
  accessories: string[];
}

export interface Layer {
  key: string;
  url: string;
  slot: "static" | "eyes" | "mouth";
  /** file name without extension, lowercase (e.g. "eye_happy") */
  variant: string;
}

export const DEFAULT_AVATAR: AvatarConfig = { skin: "default", hairstyle: "default", outfit: "default", accessories: [], view: "full" };
const CONFIG_KEY = "mana.avatar.v1";

export function validateAvatarConfig(value: unknown): AvatarConfig {
  const result: AvatarConfig = { ...DEFAULT_AVATAR, accessories: [] as string[] };
  if (!isRecord(value)) return result;
  for (const key of ["skin", "outfit", "hairstyle"] as const) {
    if (nonEmptyString(value[key])) result[key] = value[key];
  }
  result.accessories = stringList(value.accessories);
  if (typeof value.view === "string" && Object.prototype.hasOwnProperty.call(VIEWS, value.view)) result.view = value.view;
  if (Array.isArray(value.looks)) {
    const names = new Set<string>();
    result.looks = [];
    for (const look of value.looks.slice(0, 30)) {
      if (!isRecord(look) || !nonEmptyString(look.name) || look.name.trim().length > 60) continue;
      const name = look.name.trim();
      if (names.has(name.toLowerCase())) continue;
      if (![look.skin, look.outfit, look.hairstyle].every(nonEmptyString)) continue;
      names.add(name.toLowerCase());
      result.looks.push({ name, skin: look.skin as string, outfit: look.outfit as string,
        hairstyle: look.hairstyle as string, accessories: stringList(look.accessories) });
    }
  }
  return result;
}

export function loadAvatarConfig(): AvatarConfig {
  try {
    const raw = readStored(CONFIG_KEY);
    if (raw) return validateAvatarConfig(JSON.parse(raw));
  } catch {
    /* ignore */
  }
  return validateAvatarConfig(null);
}

export function saveAvatarConfig(c: AvatarConfig) {
  try {
    writeStored(CONFIG_KEY, JSON.stringify(validateAvatarConfig(c)));
  } catch {
    /* ignore */
  }
}

// ---------------------------------------------------------------- loading

function mimeFor(rel: string): string {
  const l = rel.toLowerCase();
  if (l.endsWith(".webp")) return "image/webp";
  if (l.endsWith(".jpg") || l.endsWith(".jpeg")) return "image/jpeg";
  return "image/png";
}

/** Reads every image (and items.json) in the avatar folder through the Rust side. */
export async function loadAvatarAssets(dir: string): Promise<AvatarAssets> {
  const files = await invoke<string[]>("scan_avatar", { dir });
  const urls = new Map<string, string>();
  let items: ItemCatalog = {};
  let itemsError: string | undefined;
  let invalidCatalog = false;
  await Promise.all(
    files.map(async (rel) => {
      if (rel.toLowerCase() === "items.json") {
        try {
          const data = await invoke<ArrayBuffer | number[]>("read_avatar_image", { dir, rel });
          const bytes = data instanceof ArrayBuffer ? data : new Uint8Array(data).buffer;
          const parsed = JSON.parse(new TextDecoder().decode(bytes));
          const validated = validateCatalog(parsed);
          items = validated.items;
          itemsError = validated.errors.length ? validated.errors.join("; ") : undefined;
          invalidCatalog = !isRecord(parsed);
        } catch (e) {
          itemsError = `items.json could not be read: ${e}`;
          invalidCatalog = true;
        }
        return;
      }
      const data = await invoke<ArrayBuffer | number[]>("read_avatar_image", { dir, rel });
      const bytes = data instanceof ArrayBuffer ? data : new Uint8Array(data).buffer;
      urls.set(rel.toLowerCase(), URL.createObjectURL(new Blob([bytes], { type: mimeFor(rel) })));
    }),
  );
  const assets = { files: files.filter((f) => f.toLowerCase() !== "items.json"), urls, items, itemsError };
  if (invalidCatalog) {
    const options = listOptions(assets);
    for (const id of [
      ...options.skins.map((n) => `base/${n}`), ...options.outfits.map((n) => `outfits/${n}`),
      ...options.hairstyles.map((n) => `hairstyles/${n}`), ...options.accessories.map((n) => `accessories/${n}`),
    ]) items[id] = { unlock: { type: "invalid" } };
  }
  return assets;
}

export function revokeAssets(a: AvatarAssets) {
  a.urls.forEach((u) => URL.revokeObjectURL(u));
}

// ---------------------------------------------------------------- layout rules

const stem = (name: string) => name.replace(/\.[^.]+$/, "");
const lastPart = (rel: string) => rel.split("/").pop() ?? rel;
/** "hair_back", "outfit_back" ... go behind the body / other layers */
const isBehind = (rel: string) => /(^|_)back($|_)/i.test(stem(lastPart(rel)));

/** Files directly inside a folder (not in sub-folders), sorted by name. */
function filesIn(a: AvatarAssets, folder: string): string[] {
  const prefix = folder.toLowerCase() + "/";
  return a.files
    .filter((f) => {
      const l = f.toLowerCase();
      return l.startsWith(prefix) && !l.slice(prefix.length).includes("/");
    })
    .sort();
}

/**
 * Every accessory with the depth it sits at. A depth comes from, in order:
 * the accessorySlots table in avatar-map.json, the sub-folder it lives in
 * (accessories/behind-body/wings.png), or "top".
 */
export function listAccessories(a: AvatarAssets): Accessory[] {
  const out: Accessory[] = [];
  for (const rel of a.files) {
    const p = rel.split("/");
    if (p[0].toLowerCase() !== "accessories") continue;
    let folderSlot: AccessorySlot | undefined;
    if (p.length === 3) {
      const f = p[1].toLowerCase();
      if (!isSlot(f)) continue; // unknown sub-folder: ignore
      folderSlot = f;
    } else if (p.length !== 2) {
      continue;
    }
    const name = stem(p[p.length - 1]);
    const override = SLOT_OVERRIDE[name.toLowerCase()];
    const slot: AccessorySlot = override && isSlot(override) ? override : (folderSlot ?? "top");
    out.push({ name, rel, slot });
  }
  return out.sort((x, y) => x.name.localeCompare(y.name));
}

export function listOptions(a: AvatarAssets): AvatarOptions {
  const skins = new Set<string>();
  const hairstyles = new Set<string>();
  const outfits = new Set<string>();
  for (const f of a.files) {
    const p = f.split("/");
    const top = p[0].toLowerCase();
    if (top === "base") {
      if (p.length === 2) skins.add("default"); // loose files in base/ are the default skin
      else if (p.length >= 3) skins.add(p[1]);
    } else if (top === "hairstyles" && p.length >= 3) hairstyles.add(p[1]);
    else if (top === "outfits" && p.length >= 3) outfits.add(p[1]);
  }
  return {
    skins: Array.from(skins).filter((name) => hasRequiredAsset(a, "skin", name)),
    hairstyles: Array.from(hairstyles).filter((name) => hasRequiredAsset(a, "hair", name)),
    outfits: Array.from(outfits).filter((name) => hasRequiredAsset(a, "outfit", name)),
    accessories: listAccessories(a).map((x) => x.name),
  };
}

/** Files of one skin. "default" is the loose files in base/ (or base/default/). */
export function skinFiles(a: AvatarAssets, skin: string): string[] {
  if (skin.toLowerCase() === "default") return [...filesIn(a, "base"), ...filesIn(a, "base/default")];
  return filesIn(a, `base/${skin}`);
}

/** Required layers must be loaded, not merely present in a directory listing. */
export function hasRequiredAsset(a: AvatarAssets, slot: "skin" | "outfit" | "hair", name: string): boolean {
  const files = slot === "skin" ? skinFiles(a, name) : filesIn(a, `${slot === "hair" ? "hairstyles" : "outfits"}/${name}`);
  const required = slot === "skin" ? "body" : slot === "hair" ? "hair_front" : "outfit";
  return files.some((f) => stem(lastPart(f)).toLowerCase() === required && a.urls.has(f.toLowerCase()));
}

/**
 * Body, outfit and front hair are required. Missing layers prevent rendering
 * and produce an explanation for the stage.
 */
export function requiredProblem(a: AvatarAssets, cfg: AvatarConfig): string | null {
  if (!hasRequiredAsset(a, "skin", cfg.skin)) return `Her base body is missing (looked for base/${cfg.skin === "default" ? "body.png" : cfg.skin + "/body.png"}). I won't draw her without it.`;
  if (!hasRequiredAsset(a, "outfit", cfg.outfit)) return `Her outfit is missing (expected outfits/${cfg.outfit}/outfit.png), so I won't draw her.`;
  if (!hasRequiredAsset(a, "hair", cfg.hairstyle)) return `Her hairstyle is missing (expected hairstyles/${cfg.hairstyle}/hair_front.png), so I won't draw her.`;
  return null;
}

/**
 * Bottom-to-top draw order:
 *   [back accessories] hair back, [behind-body accessories], outfit back, body, outfit,
 *   mouths, eyes, [behind-front-hair accessories], hair front + extras (ahoge), [top accessories]
 */
export function buildLayers(a: AvatarAssets, cfg: AvatarConfig): Layer[] {
  if (requiredProblem(a, cfg)) return [];
  const out: Layer[] = [];
  const add = (rel: string, slot: Layer["slot"] = "static") => {
    const url = a.urls.get(rel.toLowerCase());
    if (url) out.push({ key: rel, url, slot, variant: stem(lastPart(rel)).toLowerCase() });
  };
  const chosen = listAccessories(a).filter((x) => cfg.accessories.includes(x.name));
  const addAccessories = (slot: AccessorySlot) => chosen.filter((x) => x.slot === slot).forEach((x) => add(x.rel));

  const hair = filesIn(a, `hairstyles/${cfg.hairstyle}`);
  const outfit = filesIn(a, `outfits/${cfg.outfit}`);
  const frontRank = (f: string) => (/front/i.test(lastPart(f)) ? 0 : 1);

  addAccessories("back");
  hair.filter(isBehind).forEach((f) => add(f));
  addAccessories("behind-body");
  outfit.filter(isBehind).forEach((f) => add(f));
  skinFiles(a, cfg.skin).forEach((f) => add(f));
  outfit.filter((f) => !isBehind(f)).forEach((f) => add(f));
  filesIn(a, "mouth").forEach((f) => add(f, "mouth"));
  filesIn(a, "eyes").forEach((f) => add(f, "eyes"));
  addAccessories("behind-front-hair");
  hair
    .filter((f) => !isBehind(f))
    .sort((x, y) => frontRank(x) - frontRank(y) || x.localeCompare(y))
    .forEach((f) => add(f));
  addAccessories("top");

  return out;
}

// ---------------------------------------------------------------- lip sync

const VOWELS = "aeiou";

/**
 * Reads the next "mouth beat" from the text she is saying.
 * A vowel shows that vowel's mouth; any run of consonants/spaces/punctuation
 * is one closed-mouth beat, so speech looks like open-close-open-close.
 */
export function nextMouth(text: string, pos: number): { shape: Vowel | null; pos: number } {
  if (pos >= text.length) return { shape: null, pos: text.length };
  const ch = text[pos].toLowerCase();
  if (VOWELS.includes(ch)) return { shape: ch as Vowel, pos: pos + 1 };
  let i = pos;
  while (i < text.length && !VOWELS.includes(text[i].toLowerCase())) i++;
  return { shape: null, pos: i };
}
