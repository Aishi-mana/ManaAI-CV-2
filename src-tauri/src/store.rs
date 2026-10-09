use rusqlite::{params, Connection};
use std::collections::BTreeMap;
use std::path::Path;
use std::sync::Mutex;

pub const KEYS: [&str; 24] = [
    "mana.settings.v1",
    "mana.chat.v1",
    "mana.avatar.v1",
    "mana.stats.v1",
    "mana.memory_reviews.v1",
    "mana.internal_state.v1",
    "mana.diary.v1",
    "mana.daily_journal.v1",
    "mana.initiative.v1",
    "mana.relationship.v1",
    "mana.activity.v1",
    "mana.goals.v1",
    "mana.interests.v1",
    "mana.work.v1",
    "mana.playtests.v1",
    "mana.followups.v1",
    "mana.shared_activities.v1",
    "mana.chat_archives.v1",
    "mana.personality.v1",
    "mana.thoughts.v1",
    "mana.events.v1",
    "mana.episodes.v1",
    "mana.narratives.v1",
    "mana.skills.v1",
];

#[cfg(test)]
#[path = "store_tests.rs"]
mod tests;
#[derive(Default)]
pub struct Store(pub Mutex<Option<Connection>>);

pub fn open(path: &Path) -> Result<Connection, String> {
    let connection = Connection::open(path).map_err(|e| e.to_string())?;
    connection
        .busy_timeout(std::time::Duration::from_secs(5))
        .map_err(|e| e.to_string())?;
    let version: i64 = connection
        .query_row("PRAGMA user_version", [], |row| row.get(0))
        .map_err(|e| e.to_string())?;
    if version > 3 {
        return Err("This database was created by a newer version of Mana.".into());
    }
    connection
        .execute_batch(
            "BEGIN;
      CREATE TABLE IF NOT EXISTS app_state (key TEXT PRIMARY KEY, value TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS legacy_backup (key TEXT PRIMARY KEY, value TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS metadata (key TEXT PRIMARY KEY, value TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS identity (id TEXT PRIMARY KEY, relationship TEXT NOT NULL, biography TEXT NOT NULL, personality TEXT NOT NULL, values_json TEXT NOT NULL, interests_json TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS memories (id TEXT PRIMARY KEY, content TEXT NOT NULL, category TEXT NOT NULL CHECK(category IN ('user','mana','shared')), importance INTEGER NOT NULL CHECK(importance BETWEEN 1 AND 5), pinned INTEGER NOT NULL CHECK(pinned IN (0,1)), created_at TEXT NOT NULL, updated_at TEXT NOT NULL);
      ",
        )
        .map_err(|e| e.to_string())?;
    if version < 3 {
        connection.execute_batch("ALTER TABLE memories ADD COLUMN strength REAL NOT NULL DEFAULT 60 CHECK(strength BETWEEN 5 AND 100);
          ALTER TABLE memories ADD COLUMN strength_updated_at TEXT NOT NULL DEFAULT '';
          ALTER TABLE memories ADD COLUMN last_recalled_at TEXT;
          ALTER TABLE memories ADD COLUMN recall_count INTEGER NOT NULL DEFAULT 0 CHECK(recall_count >= 0);
          UPDATE memories SET strength_updated_at = updated_at;").map_err(|e| e.to_string())?;
    }
    connection
        .execute_batch("PRAGMA user_version=3; COMMIT;")
        .map_err(|e| e.to_string())?;
    Ok(connection)
}

pub fn initialize(
    connection: &mut Connection,
    legacy: &BTreeMap<String, String>,
) -> Result<BTreeMap<String, String>, String> {
    let transaction = connection.transaction().map_err(|e| e.to_string())?;
    let migrated: bool = transaction
        .query_row(
            "SELECT EXISTS(SELECT 1 FROM metadata WHERE key = 'local_storage_migrated')",
            [],
            |row| row.get(0),
        )
        .map_err(|e| e.to_string())?;
    if !migrated {
        for (key, value) in legacy {
            if !KEYS.contains(&key.as_str()) {
                continue;
            }
            transaction
                .execute(
                    "INSERT OR IGNORE INTO legacy_backup(key,value) VALUES (?1,?2)",
                    params![key, value],
                )
                .map_err(|e| e.to_string())?;
            if serde_json::from_str::<serde_json::Value>(value).is_ok() {
                transaction
                    .execute(
                        "INSERT OR IGNORE INTO app_state(key,value) VALUES (?1,?2)",
                        params![key, value],
                    )
                    .map_err(|e| e.to_string())?;
            }
        }
        transaction
            .execute(
                "INSERT INTO metadata(key,value) VALUES ('local_storage_migrated','1')",
                [],
            )
            .map_err(|e| e.to_string())?;
    }
    transaction.commit().map_err(|e| e.to_string())?;
    let mut statement = connection
        .prepare("SELECT key,value FROM app_state")
        .map_err(|e| e.to_string())?;
    let rows = statement
        .query_map([], |row| {
            Ok((row.get::<_, String>(0)?, row.get::<_, String>(1)?))
        })
        .map_err(|e| e.to_string())?;
    let mut result = rows
        .collect::<Result<BTreeMap<_, _>, _>>()
        .map_err(|e| e.to_string())?;
    crate::character::load(connection, &mut result)?;
    Ok(result)
}

pub fn save(connection: &mut Connection, values: &BTreeMap<String, String>) -> Result<(), String> {
    for (key, value) in values {
        if !KEYS.contains(&key.as_str())
            && !["mana.identity.v1", "mana.memories.v1"].contains(&key.as_str())
        {
            return Err("Unknown saved-data key".into());
        }
        serde_json::from_str::<serde_json::Value>(value)
            .map_err(|e| format!("Invalid saved JSON: {e}"))?;
    }
    let transaction = connection.transaction().map_err(|e| e.to_string())?;
    for (key, value) in values {
        if key == "mana.identity.v1" {
            crate::character::save_identity(&transaction, value)?;
            continue;
        }
        if key == "mana.memories.v1" {
            crate::character::save_memories(&transaction, value)?;
            continue;
        }
        transaction.execute("INSERT INTO app_state(key,value) VALUES (?1,?2) ON CONFLICT(key) DO UPDATE SET value=excluded.value", params![key,value]).map_err(|e| e.to_string())?;
    }
    transaction.commit().map_err(|e| e.to_string())
}
