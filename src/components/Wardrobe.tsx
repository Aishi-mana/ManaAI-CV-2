import { useState } from "react";
import type { AvatarConfig } from "../core/avatar";
import type { Stats } from "../core/progress";
import { resolveLoadout } from "../core/wardrobe";
import type { Entry, Wardrobe as WardrobeData } from "../core/wardrobe";

type Tab = "outfit" | "hair" | "skin" | "accessories";

interface Props {
  data: WardrobeData;
  cfg: AvatarConfig;
  stats: Stats;
  charName: string;
  itemsError?: string;
  onChange: (c: AvatarConfig) => void;
  onClose: () => void;
}

const TABS: { key: Tab; label: string }[] = [
  { key: "outfit", label: "Outfit" },
  { key: "hair", label: "Hair" },
  { key: "skin", label: "Skin" },
  { key: "accessories", label: "Accessories" },
];

const REQUIRED_NOTE: Partial<Record<Tab, string>> = {
  outfit: "Her default outfit is always available and can't be removed.",
  hair: "She always wears a hairstyle. The default is always available.",
  skin: "Her default skin is always available.",
};

export default function Wardrobe({ data, cfg, stats, charName, itemsError, onChange, onClose }: Props) {
  const [tab, setTab] = useState<Tab>("outfit");
  const [lookName, setLookName] = useState("");
  const [notice, setNotice] = useState("");
  const looks = cfg.looks ?? [];

  function saveLook() {
    const name = lookName.trim();
    if (!name || name.length > 60 || looks.length >= 30) return;
    if (looks.some((look) => look.name.toLowerCase() === name.toLowerCase())) {
      setNotice("That name is already saved. Choose another name or delete the old look first.");
      return;
    }
    onChange({ ...cfg, looks: [...looks, { name, skin: cfg.skin, outfit: cfg.outfit,
      hairstyle: cfg.hairstyle, accessories: [...cfg.accessories] }] });
    setLookName("");
    setNotice(`Saved ${name}.`);
  }

  const single =
    tab === "outfit"
      ? { list: data.outfits, current: cfg.outfit, pick: (n: string) => onChange({ ...cfg, outfit: n }) }
      : tab === "hair"
        ? { list: data.hairs, current: cfg.hairstyle, pick: (n: string) => onChange({ ...cfg, hairstyle: n }) }
        : tab === "skin"
          ? { list: data.skins, current: cfg.skin, pick: (n: string) => onChange({ ...cfg, skin: n }) }
          : null;

  function toggleAccessory(e: Entry) {
    if (!e.unlocked) return;
    const has = cfg.accessories.includes(e.name);
    onChange({ ...cfg, accessories: has ? cfg.accessories.filter((n) => n !== e.name) : [...cfg.accessories, e.name] });
  }

  const lockedNote = (e: Entry) => (!e.unlocked ? <span className="lock-note">Locked: {e.hint || "keep spending time together"}</span> : null);

  return (
    <>
      <div className="scrim" onClick={onClose} />
      <section className="drawer" role="dialog" aria-label="Wardrobe">
        <header className="drawer-head">
          <h2>{charName}'s wardrobe</h2>
          <button className="btn" onClick={onClose}>Close</button>
        </header>

        <div className="drawer-body">
          <p className="progress-card">
            Days together: <b>{stats.days.length}</b> &middot; Messages: <b>{stats.messages}</b> &middot; Coding level: <b>{stats.skill}</b>
          </p>
          {itemsError && <p className="msg-error">{itemsError}</p>}

          <h3>Saved looks ({looks.length}/30)</h3>
          <p className="hint-soft">Save your current skin, outfit, hair and accessories. Applying a look keeps your current body view. Missing or locked items use available defaults.</p>
          <label>Look name
            <input className="input" value={lookName} maxLength={60} onChange={(e) => setLookName(e.target.value)} />
          </label>
          <button className="btn" disabled={!lookName.trim() || looks.length >= 30} onClick={saveLook}>Save current look</button>
          {notice && <p role="status">{notice}</p>}
          {looks.map((look) => <div className="progress-card" key={look.name}>
            <b>{look.name}</b>
            <p className="hint-soft">{look.skin} · {look.outfit} · {look.hairstyle} · {look.accessories.length} accessories</p>
            <button className="btn" onClick={() => {
              const next = resolveLoadout({ ...cfg, ...look }, data);
              const changed = next.skin !== look.skin || next.outfit !== look.outfit || next.hairstyle !== look.hairstyle || next.accessories.length !== look.accessories.length;
              onChange(next);
              setNotice(changed ? `Applied ${look.name} with available items. Some saved items are missing or locked.` : `Applied ${look.name}.`);
            }}>Apply look</button>
            <button className="btn" onClick={() => {
              if (!window.confirm(`Delete saved look "${look.name}"?`)) return;
              onChange({ ...cfg, looks: looks.filter((entry) => entry.name !== look.name) });
              setNotice(`Deleted ${look.name}.`);
            }}>Delete look</button>
          </div>)}

          <div className="tabs" role="tablist">
            {TABS.map((t) => (
              <button key={t.key} role="tab" aria-selected={tab === t.key} className="tab" onClick={() => setTab(t.key)}>
                {t.label}
              </button>
            ))}
          </div>

          {single && (
            <>
              {REQUIRED_NOTE[tab] && <p className="hint-soft">{REQUIRED_NOTE[tab]}</p>}
              <div className="items" role="radiogroup">
                {single.list.length === 0 && <p className="hint-soft">Nothing found in this folder yet.</p>}
                {single.list.map((e) => (
                  <label key={e.id} className={`item${e.unlocked ? "" : " locked"}`}>
                    <input type="radio" name={tab} disabled={!e.unlocked} checked={single.current === e.name} onChange={() => single.pick(e.name)} />
                    <span className="item-name">
                      {e.label}
                      {e.isDefault && <em className="slot-note"> (default)</em>}
                    </span>
                    {lockedNote(e)}
                  </label>
                ))}
              </div>
            </>
          )}

          {tab === "accessories" && (
            <div className="items">
              {data.accessories.length === 0 && <p className="hint-soft">No accessories found yet.</p>}
              {data.accessories.map((e) => (
                <label key={e.id} className={`item${e.unlocked ? "" : " locked"}`}>
                  <input type="checkbox" disabled={!e.unlocked} checked={cfg.accessories.includes(e.name)} onChange={() => toggleAccessory(e)} />
                  <span className="item-name">
                    {e.label}
                    {e.slot && e.slot !== "top" && <em className="slot-note"> ({e.slot.replace(/-/g, " ")})</em>}
                  </span>
                  {lockedNote(e)}
                </label>
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
