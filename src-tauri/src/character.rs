use rusqlite::{params, Transaction};
use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Identity {
    relationship: String,
    biography: String,
    personality: String,
    values: Vec<String>,
    interests: Vec<String>,
}

#[derive(Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Memory {
    id: String,
    content: String,
    category: String,
    importance: u8,
    pinned: bool,
    created_at: String,
    updated_at: String,
    #[serde(default = "default_strength")]
    strength: f64,
    #[serde(default)]
    strength_updated_at: String,
    #[serde(default)]
    last_recalled_at: Option<String>,
    #[serde(default)]
    recall_count: i64,
}

fn default_strength() -> f64 {
    60.0
}

pub fn save_identity(tx: &Transaction, raw: &str) -> Result<(), String> {
    let identity: Identity = serde_json::from_str(raw).map_err(|e| e.to_string())?;
    if identity.relationship.trim().is_empty()
        || identity.relationship.len() > 2000
        || identity.biography.len() > 10000
        || identity.personality.len() > 10000
        || identity
            .values
            .iter()
            .chain(&identity.interests)
            .any(|s| s.trim().is_empty() || s.len() > 1000)
    {
        return Err("Invalid identity fields".into());
    }
    tx.execute("INSERT INTO identity(id,relationship,biography,personality,values_json,interests_json) VALUES ('mana',?1,?2,?3,?4,?5)
      ON CONFLICT(id) DO UPDATE SET relationship=excluded.relationship,biography=excluded.biography,personality=excluded.personality,values_json=excluded.values_json,interests_json=excluded.interests_json",
      params![identity.relationship,identity.biography,identity.personality,serde_json::to_string(&identity.values).unwrap(),serde_json::to_string(&identity.interests).unwrap()]).map_err(|e| e.to_string())?;
    Ok(())
}

pub fn save_memories(tx: &Transaction, raw: &str) -> Result<(), String> {
    let memories: Vec<Memory> = serde_json::from_str(raw).map_err(|e| e.to_string())?;
    for memory in &memories {
        if memory.id.trim().is_empty()
            || memory.content.trim().is_empty()
            || memory.content.len() > 20000
            || !(1..=5).contains(&memory.importance)
            || !["user", "mana", "shared"].contains(&memory.category.as_str())
            || memory.created_at.is_empty()
            || memory.updated_at.is_empty()
            || !memory.strength.is_finite()
            || !(5.0..=100.0).contains(&memory.strength)
            || memory.recall_count < 0
            || memory.recall_count > 9_007_199_254_740_991
        {
            return Err("Invalid memory fields".into());
        }
    }
    tx.execute("DELETE FROM memories", [])
        .map_err(|e| e.to_string())?;
    for mut m in memories {
        if m.strength_updated_at.is_empty() {
            m.strength_updated_at = m.updated_at.clone();
        }
        tx.execute("INSERT INTO memories(id,content,category,importance,pinned,created_at,updated_at,strength,strength_updated_at,last_recalled_at,recall_count) VALUES (?1,?2,?3,?4,?5,?6,?7,?8,?9,?10,?11)",
            params![m.id,m.content,m.category,m.importance,m.pinned,m.created_at,m.updated_at,m.strength,m.strength_updated_at,m.last_recalled_at,m.recall_count]).map_err(|e| e.to_string())?;
    }
    Ok(())
}

pub fn load(
    connection: &rusqlite::Connection,
    result: &mut std::collections::BTreeMap<String, String>,
) -> Result<(), String> {
    use rusqlite::OptionalExtension;
    let identity = connection.query_row("SELECT relationship,biography,personality,values_json,interests_json FROM identity WHERE id='mana'", [], |row| {
        Ok((row.get::<_,String>(0)?,row.get::<_,String>(1)?,row.get::<_,String>(2)?,row.get::<_,String>(3)?,row.get::<_,String>(4)?))
    }).optional().map_err(|e| e.to_string())?;
    if let Some((relationship, biography, personality, values, interests)) = identity {
        let identity = Identity {
            relationship,
            biography,
            personality,
            values: serde_json::from_str(&values).map_err(|e| e.to_string())?,
            interests: serde_json::from_str(&interests).map_err(|e| e.to_string())?,
        };
        result.insert(
            "mana.identity.v1".into(),
            serde_json::to_string(&identity).map_err(|e| e.to_string())?,
        );
    }
    let mut statement = connection.prepare("SELECT id,content,category,importance,pinned,created_at,updated_at,strength,strength_updated_at,last_recalled_at,recall_count FROM memories ORDER BY created_at,id").map_err(|e| e.to_string())?;
    let memories = statement
        .query_map([], |row| {
            Ok(Memory {
                id: row.get(0)?,
                content: row.get(1)?,
                category: row.get(2)?,
                importance: row.get(3)?,
                pinned: row.get(4)?,
                created_at: row.get(5)?,
                updated_at: row.get(6)?,
                strength: row.get(7)?,
                strength_updated_at: row.get(8)?,
                last_recalled_at: row.get(9)?,
                recall_count: row.get(10)?,
            })
        })
        .map_err(|e| e.to_string())?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())?;
    if !memories.is_empty() {
        result.insert(
            "mana.memories.v1".into(),
            serde_json::to_string(&memories).map_err(|e| e.to_string())?,
        );
    }
    Ok(())
}
