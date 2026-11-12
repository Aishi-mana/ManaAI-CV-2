import { VIEWS, EMOTION_MAP, buildLayers, listAccessories, listOptions, hasBackHair } from "./avatar";
import type { AccessorySlot, AvatarAssets, AvatarConfig } from "./avatar";
import { hintFor, isUnlocked } from "./progress";
import type { Stats } from "./progress";

export interface Entry {
  /** e.g. "outfits/summer" */
  id: string;
  name: string;
  label: string;
  unlocked: boolean;
  hint: string;
  isDefault: boolean;
  slot?: AccessorySlot;
  hasBackHair?: boolean;
}

export interface Wardrobe {
  skins: Entry[];
  outfits: Entry[];
  hairs: Entry[];
  accessories: Entry[];
}

const pretty = (s: string) => s.replace(/^atelier_(.+)-\d+$/, "$1").replace(/_/g, " ").replace(/\s+/g," ").trim();

export function allItemIds(a: AvatarAssets): string[] {
  const o = listOptions(a);
  return [
    ...o.skins.map((n) => `base/${n}`),
    ...o.outfits.map((n) => `outfits/${n}`),
    ...o.hairstyles.map((n) => `hairstyles/${n}`),
    ...listAccessories(a).map((x) => `accessories/${x.name}`),
  ];
}

export function itemLabel(a: AvatarAssets, id: string): string {
  return a.items[id]?.name ?? pretty(id.split("/").pop() ?? id);
}

export function buildWardrobe(a: AvatarAssets, stats: Stats, now: Date, who: string): Wardrobe {
  const mk = (prefix: string, name: string, slot?: AccessorySlot): Entry => {
    const id = `${prefix}/${name}`;
    const unlocked = isUnlocked(id, a.items, stats, now);
    return {
      id,
      name,
      label: itemLabel(a, id),
      unlocked,
      hint: unlocked ? "" : hintFor(id, a.items, stats, now, who),
      isDefault: name === "default",
      slot,
    };
  };
  const order = (list: Entry[]) =>
    list.sort((x, y) => Number(y.isDefault) - Number(x.isDefault) || x.label.localeCompare(y.label));
  const o = listOptions(a);
  return {
    skins: order(o.skins.map((n) => mk("base", n))),
    outfits: order(o.outfits.map((n) => mk("outfits", n))),
    hairs: order(o.hairstyles.map((n) => ({...mk("hairstyles", n),hasBackHair:hasBackHair(a,n)}))),
    accessories: order(listAccessories(a).map((x) => mk("accessories", x.name, x.slot))),
  };
}

/** Skin, outfit and hairstyle can never be empty or locked: fall back to the default. */
function pickRequired(list: Entry[], want: string): string {
  const exact = list.find((e) => e.name === want && e.unlocked);
  if (exact) return exact.name;
  const def = list.find((e) => e.isDefault);
  if (def) return def.name;
  return "default";
}

/**
 * The one place the loadout rules are enforced. Whatever is saved (even a hand-edited
 * file, a deleted folder, or a still-locked item), the result always has a skin, an
 * outfit and a hairstyle, and only unlocked accessories.
 */
export function resolveLoadout(saved: AvatarConfig, w: Wardrobe): AvatarConfig {
  return {
    ...(saved.looks ? { looks: saved.looks } : {}),
    ...(saved.outfitNames ? { outfitNames: saved.outfitNames } : {}),
    ...(saved.itemNames ? { itemNames: saved.itemNames } : {}),
    ...(saved.outfitRoutine?{outfitRoutine:saved.outfitRoutine}:{}),
    ...(saved.seasonalLooks?{seasonalLooks:saved.seasonalLooks}:{}),
    ...(saved.outfitGenerationSeason?{outfitGenerationSeason:saved.outfitGenerationSeason}:{}),
    ...(saved.seasonCalendar?{seasonCalendar:saved.seasonCalendar}:{}),
    ...(saved.background?{background:saved.background}:{}),
    ...(saved.backgroundImage?{backgroundImage:saved.backgroundImage}:{}),
    skin: pickRequired(w.skins, saved.skin),
    outfit: pickRequired(w.outfits, saved.outfit),
    hairstyle: pickRequired(w.hairs, saved.hairstyle),
    ...(saved.backHairstyle && w.hairs.some(e=>e.name===saved.backHairstyle&&e.unlocked&&e.hasBackHair!==false)?{backHairstyle:saved.backHairstyle}:{}),
    accessories: saved.accessories.filter((n) => w.accessories.some((e) => e.name === n && e.unlocked)),
    view: VIEWS[saved.view] ? saved.view : "full",
  };
}

/** Inventory thumbnails use actual selected item layers; skin previews stay dressed. */
export function wardrobePreviewLayers(a:AvatarAssets,cfg:AvatarConfig,category:'outfit'|'hair'|'skin'|'accessories',name:string){
 const next={...cfg,accessories:[...cfg.accessories]};
 if(category==='outfit')next.outfit=name;else if(category==='hair'){next.hairstyle=name;delete next.backHairstyle;}else if(category==='skin')next.skin=name;else next.accessories=[name];
 const neutral=EMOTION_MAP.neutral;
 return buildLayers(a,next).filter(layer=>category==='skin'?(layer.slot==='static'||layer.variant===(layer.slot==='eyes'?neutral.eyes:neutral.mouth)):layer.key.toLowerCase().startsWith(category==='outfit'?'outfits/':category==='hair'?'hairstyles/':'accessories/'));
}

export type RenameCategory='outfit'|'hair'|'skin'|'accessories'|'looks';
export function renameWardrobeItem(cfg:AvatarConfig,category:RenameCategory,id:string,value:string):AvatarConfig{
 const name=value.trim();if(!name||name.length>(category==='looks'?60:80))throw Error('Enter a shorter, non-empty name.');
 if(category==='outfit')return {...cfg,outfitNames:{...cfg.outfitNames,[id]:name}};
 if(category!=='looks')return {...cfg,itemNames:{...cfg.itemNames,[category+':'+id]:name}};
 const look=cfg.looks?.find(l=>l.name===id);if(!look)throw Error('That saved look is no longer available.');if(cfg.looks?.some(l=>l.name!==id&&l.name.toLowerCase()===name.toLowerCase()))throw Error('That look name is already used.');
 const same=(l:typeof look)=>l.name===id&&l.outfit===look.outfit&&l.skin===look.skin&&l.hairstyle===look.hairstyle&&(l.backHairstyle??l.hairstyle)===(look.backHairstyle??look.hairstyle)&&JSON.stringify([...l.accessories].sort())===JSON.stringify([...look.accessories].sort());
 const change=(l:typeof look)=>same(l)?{...l,name}:l;
 return {...cfg,looks:cfg.looks!.map(change),...(cfg.outfitRoutine?{outfitRoutine:{...cfg.outfitRoutine,preferredLookNames:cfg.outfitRoutine.preferredLookNames?.map(lookName=>lookName===id?name:lookName),pools:{morning:cfg.outfitRoutine.pools.morning.map(change),night:cfg.outfitRoutine.pools.night.map(change)}}}:{}),...(cfg.seasonalLooks?{seasonalLooks:Object.fromEntries(Object.entries(cfg.seasonalLooks).map(([season,l])=>[season,change(l)]))}:{})};
}
