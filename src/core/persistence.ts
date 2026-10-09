import { invoke } from "@tauri-apps/api/core";

const KEYS = ["mana.settings.v1", "mana.chat.v1", "mana.avatar.v1", "mana.stats.v1"];
const desktop = typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
let initialized = false;
let cache: Record<string, string> = {};
const pending = new Map<string, string>();
const listeners = new Set<() => void>();
let status = { error: "", pending: 0 };
let flushing: Promise<void> | null = null;
let timer: ReturnType<typeof setTimeout> | undefined;
let restoring=false;

function publish(error = status.error) {
  status = { error, pending: pending.size };
  listeners.forEach((fn) => fn());
}
export const persistenceStatus = () => status;
export function subscribePersistence(fn: () => void) { listeners.add(fn); return () => { listeners.delete(fn); }; }

export async function initializePersistence() {
  if (initialized) return;
  if (!desktop) { initialized = true; return; }
  const legacy: Record<string, string> = {};
  // If storage is inaccessible, stop startup rather than mark migration complete with no data.
  for (const key of KEYS) {
    const raw = localStorage.getItem(key);
    if (raw !== null) legacy[key] = raw;
  }
  cache = await invoke<Record<string, string>>("initialize_store", { legacy });
  initialized = true;
}

export function readStored(key: string): string | null {
  if (desktop && initialized) return cache[key] ?? null;
  return localStorage.getItem(key);
}

export function writeStored(key: string, value: string) {
  if(restoring)return; // Ignore writes from the old document during restore/reload.
  if (!desktop) {
    try { localStorage.setItem(key, value); publish(""); }
    catch (e) { publish(`Could not save data: ${String(e)}`); }
    return;
  }
  if (!initialized) throw new Error("Saved data has not loaded yet");
  cache[key] = value;
  pending.set(key, value);
  publish();
  if (!timer && !status.error) timer = setTimeout(() => {
    timer = undefined;
    void flushPersistence().catch(() => {});
  }, 150);
}

export function flushPersistence(): Promise<void> {
  if (timer) { clearTimeout(timer); timer = undefined; }
  if (flushing) return flushing;
  flushing = (async () => {
    while (pending.size) {
      const values = Object.fromEntries(pending);
      try { await invoke("save_store", { values }); }
      catch (e) { publish(`Could not save data: ${String(e)}. Your changes are still pending.`); throw e; }
      for (const [key, value] of Object.entries(values)) {
        if (pending.get(key) === value) pending.delete(key);
      }
      publish("");
    }
  })().finally(() => { flushing = null; });
  return flushing;
}

export async function restoreStored(values:Record<string,string>,safetyContent:string):Promise<void>{
 await flushPersistence();
 if(!desktop)throw new Error('Restore is available in the Mana desktop app.');
 restoring=true;
 try{await invoke('restore_backup_store',{values,safetyContent});}
 catch(e){restoring=false;throw e;}
 // Reload immediately after the atomic database transaction. Old React state must not save again.
 cache={...cache,...values};
 window.location.reload();
 // Keep the restoring UI locked until the document unloads.
 await new Promise<void>(()=>{});
}
