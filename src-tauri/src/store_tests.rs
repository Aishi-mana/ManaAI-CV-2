use super::*;

fn values(entries: &[(&str, &str)]) -> BTreeMap<String, String> {
    entries
        .iter()
        .map(|(key, value)| (key.to_string(), value.to_string()))
        .collect()
}

#[test]
fn imports_all_categories_and_preserves_raw_backup() {
    let mut db = open(Path::new(":memory:")).unwrap();
    let legacy = values(&[
        (KEYS[0], r#"{"charName":"Mana"}"#),
        (KEYS[1], r#"[{"id":"1","role":"user","content":"hello"}]"#),
        (KEYS[2], r#"{"outfit":"default"}"#),
        (KEYS[3], r#"{"messages":10}"#),
    ]);
    assert_eq!(initialize(&mut db, &legacy).unwrap(), legacy);
    let count: i64 = db
        .query_row("SELECT COUNT(*) FROM legacy_backup", [], |r| r.get(0))
        .unwrap();
    assert_eq!(count, 4);
}

#[test]
fn memory_review_decisions_persist_without_altering_memories() {
    let mut db = open(Path::new(":memory:")).unwrap();
    let reviews = r#"["message1:0","message2:1"]"#;
    save(&mut db, &values(&[("mana.memory_reviews.v1", reviews)])).unwrap();
    let loaded = initialize(&mut db, &BTreeMap::new()).unwrap();
    assert_eq!(loaded["mana.memory_reviews.v1"], reviews);
    assert!(!loaded.contains_key("mana.memories.v1"));
}

#[test]
fn companion_state_persists_independently_of_chat_and_memory() {
    let mut db = open(Path::new(":memory:")).unwrap();
    let state = r#"{"mood":"happy","energy":68,"curiosity":62,"socialNeed":8}"#;
    save(
        &mut db,
        &values(&[("mana.internal_state.v1", state), (KEYS[1], "[]")]),
    )
    .unwrap();
    let loaded = initialize(&mut db, &BTreeMap::new()).unwrap();
    assert_eq!(loaded["mana.internal_state.v1"], state);
    assert_eq!(loaded[KEYS[1]], "[]");
    assert!(!loaded.contains_key("mana.memories.v1"));
}

#[test]
fn diary_persists_and_deletes_independently() {
    let mut db = open(Path::new(":memory:")).unwrap();
    let entry = r#"[{"id":"d1","content":"I want to learn about puzzles","createdAt":"2026-10-08T12:00:00.000Z","sourceMessageIds":["u1"],"sourceMemoryIds":[],"mood":"thinking"}]"#;
    save(
        &mut db,
        &values(&[("mana.diary.v1", entry), (KEYS[1], "[]")]),
    )
    .unwrap();
    assert_eq!(
        initialize(&mut db, &BTreeMap::new()).unwrap()["mana.diary.v1"],
        entry
    );
    save(&mut db, &values(&[("mana.diary.v1", "[]")])).unwrap();
    let loaded = initialize(&mut db, &BTreeMap::new()).unwrap();
    assert_eq!(loaded["mana.diary.v1"], "[]");
    assert_eq!(loaded[KEYS[1]], "[]");
}

#[test]
fn daily_journal_entry_and_completion_state_save_atomically() {
    let mut db = open(Path::new(":memory:")).unwrap();
    let entries = r#"[{"id":"d1","content":"A quiet day","journalDate":"2026-10-08"}]"#;
    let schedule = r#"{"enabled":true,"time":"22:00","timeZone":"Asia/Singapore","completedDates":["2026-10-08"],"sources":[]}"#;
    save(
        &mut db,
        &values(&[
            ("mana.diary.v1", entries),
            ("mana.daily_journal.v1", schedule),
        ]),
    )
    .unwrap();
    let loaded = initialize(&mut db, &BTreeMap::new()).unwrap();
    assert_eq!(loaded["mana.diary.v1"], entries);
    assert_eq!(loaded["mana.daily_journal.v1"], schedule);
    db.execute_batch("CREATE TRIGGER reject_diary BEFORE UPDATE ON app_state WHEN NEW.key='mana.diary.v1' BEGIN SELECT RAISE(ABORT,'failure'); END;").unwrap();
    assert!(save(
        &mut db,
        &values(&[("mana.diary.v1", "[]"), ("mana.daily_journal.v1", "{}")])
    )
    .is_err());
    assert_eq!(initialize(&mut db, &BTreeMap::new()).unwrap(), loaded);
}

#[test]
fn strength_and_recall_metadata_round_trip_and_invalid_changes_roll_back() {
    let mut db = open(Path::new(":memory:")).unwrap();
    let memory = r#"[{"id":"m1","content":"Favorite food is sushi","category":"user","importance":4,"pinned":false,"createdAt":"2026-10-01T12:00:00.000Z","updatedAt":"2026-10-01T12:00:00.000Z","strength":75.5,"strengthUpdatedAt":"2026-10-08T12:00:00.000Z","lastRecalledAt":"2026-10-08T12:00:00.000Z","recallCount":3}]"#;
    save(&mut db, &values(&[("mana.memories.v1", memory)])).unwrap();
    let original = initialize(&mut db, &BTreeMap::new()).unwrap();
    let actual: serde_json::Value = serde_json::from_str(&original["mana.memories.v1"]).unwrap();
    assert_eq!(actual[0]["strength"], 75.5);
    assert_eq!(actual[0]["recallCount"], 3);
    assert_eq!(actual[0]["lastRecalledAt"], "2026-10-08T12:00:00.000Z");
    for bad in [
        memory.replace("75.5", "101"),
        memory.replace("\"recallCount\":3", "\"recallCount\":-1"),
    ] {
        assert!(save(&mut db, &values(&[("mana.memories.v1", &bad)])).is_err());
        assert_eq!(initialize(&mut db, &BTreeMap::new()).unwrap(), original);
    }
}

#[test]
fn version_two_upgrade_preserves_memories_and_initializes_strength_once() {
    let unique = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap()
        .as_nanos();
    let path = std::env::temp_dir().join(format!("mana-strength-upgrade-{unique}.sqlite3"));
    {
        let db = Connection::open(&path).unwrap();
        db.execute_batch("CREATE TABLE memories (id TEXT PRIMARY KEY,content TEXT NOT NULL,category TEXT NOT NULL,importance INTEGER NOT NULL,pinned INTEGER NOT NULL,created_at TEXT NOT NULL,updated_at TEXT NOT NULL);
          INSERT INTO memories VALUES ('old','Likes sushi','user',3,1,'2026-10-01T00:00:00.000Z','2026-10-02T00:00:00.000Z'); PRAGMA user_version=2;").unwrap();
    }
    for _ in 0..2 {
        let mut db = open(&path).unwrap();
        let loaded = initialize(&mut db, &BTreeMap::new()).unwrap();
        let memories: serde_json::Value =
            serde_json::from_str(&loaded["mana.memories.v1"]).unwrap();
        assert_eq!(memories[0]["content"], "Likes sushi");
        assert_eq!(memories[0]["pinned"], true);
        assert_eq!(memories[0]["strength"], 60.0);
        assert_eq!(memories[0]["strengthUpdatedAt"], "2026-10-02T00:00:00.000Z");
        assert_eq!(memories[0]["recallCount"], 0);
    }
    std::fs::remove_file(path).unwrap();
}

#[test]
fn identity_and_memory_records_round_trip_edit_pin_and_delete() {
    let mut db = open(Path::new(":memory:")).unwrap();
    let identity = r#"{"relationship":"Companion","biography":"Lives locally","personality":"Curious","values":["Kindness"],"interests":["Games"]}"#;
    let memory = r#"[{"id":"m1","content":"Aishi likes games","category":"user","importance":4,"pinned":false,"createdAt":"2026-10-08T12:00:00.000Z","updatedAt":"2026-10-08T12:00:00.000Z"}]"#;
    save(
        &mut db,
        &values(&[("mana.identity.v1", identity), ("mana.memories.v1", memory)]),
    )
    .unwrap();
    let loaded = initialize(&mut db, &BTreeMap::new()).unwrap();
    assert_eq!(
        serde_json::from_str::<serde_json::Value>(&loaded["mana.identity.v1"]).unwrap(),
        serde_json::from_str::<serde_json::Value>(identity).unwrap()
    );
    let actual: serde_json::Value = serde_json::from_str(&loaded["mana.memories.v1"]).unwrap();
    let expected: serde_json::Value = serde_json::from_str(memory).unwrap();
    for (key, value) in expected[0].as_object().unwrap() {
        assert_eq!(&actual[0][key], value);
    }
    assert_eq!(actual[0]["strength"], 60.0);
    let edited = memory
        .replace("likes games", "likes puzzle games")
        .replace("\"pinned\":false", "\"pinned\":true");
    save(&mut db, &values(&[("mana.memories.v1", &edited)])).unwrap();
    let loaded = initialize(&mut db, &BTreeMap::new()).unwrap();
    assert!(loaded["mana.memories.v1"].contains("puzzle games"));
    assert!(loaded["mana.memories.v1"].contains("\"pinned\":true"));
    save(&mut db, &values(&[("mana.memories.v1", "[]")])).unwrap();
    assert!(!initialize(&mut db, &BTreeMap::new())
        .unwrap()
        .contains_key("mana.memories.v1"));
    let count: i64 = db
        .query_row("SELECT COUNT(*) FROM memories", [], |r| r.get(0))
        .unwrap();
    assert_eq!(count, 0);
}

#[test]
fn invalid_memory_batch_does_not_erase_existing_records() {
    let mut db = open(Path::new(":memory:")).unwrap();
    let memory = r#"[{"id":"m1","content":"Important fact","category":"shared","importance":3,"pinned":true,"createdAt":"2026-10-08T12:00:00.000Z","updatedAt":"2026-10-08T12:00:00.000Z"}]"#;
    save(&mut db, &values(&[("mana.memories.v1", memory)])).unwrap();
    let original = initialize(&mut db, &BTreeMap::new()).unwrap();
    for invalid in [
        memory.replace("\"importance\":3", "\"importance\":9"),
        memory.replace("shared", "invalid"),
        memory.replace("Important fact", ""),
    ] {
        assert!(save(&mut db, &values(&[("mana.memories.v1", &invalid)])).is_err());
        assert_eq!(initialize(&mut db, &BTreeMap::new()).unwrap(), original);
    }
    let duplicate = format!(
        "[{},{}]",
        &memory[1..memory.len() - 1],
        &memory[1..memory.len() - 1]
    );
    assert!(save(&mut db, &values(&[("mana.memories.v1", &duplicate)])).is_err());
    assert_eq!(initialize(&mut db, &BTreeMap::new()).unwrap(), original);
}

#[test]
fn version_one_upgrade_preserves_existing_state() {
    let mut db = open(Path::new(":memory:")).unwrap();
    // The same migration SQL is idempotent; version one installations already have app_state.
    save(&mut db, &values(&[(KEYS[0], "{\"userName\":\"Aishi\"}")])).unwrap();
    db.execute_batch("DROP TABLE identity; DROP TABLE memories; PRAGMA user_version=1;")
        .unwrap();
    let unique = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap()
        .as_nanos();
    let path = std::env::temp_dir().join(format!("mana-upgrade-test-{unique}.sqlite3"));
    db.execute("VACUUM INTO ?1", [path.to_str().unwrap()])
        .unwrap();
    {
        let mut reopened = open(&path).unwrap();
        assert_eq!(
            initialize(&mut reopened, &BTreeMap::new()).unwrap()[KEYS[0]],
            "{\"userName\":\"Aishi\"}"
        );
        let version: i64 = reopened
            .query_row("PRAGMA user_version", [], |r| r.get(0))
            .unwrap();
        assert_eq!(version, 3);
    }
    std::fs::remove_file(path).unwrap();
}

#[test]
fn migration_runs_once_and_does_not_resurrect_cleared_chat() {
    let mut db = open(Path::new(":memory:")).unwrap();
    let legacy = values(&[(KEYS[1], r#"[{"content":"old chat"}]"#)]);
    initialize(&mut db, &legacy).unwrap();
    save(&mut db, &values(&[(KEYS[1], "[]")])).unwrap();
    assert_eq!(initialize(&mut db, &legacy).unwrap()[KEYS[1]], "[]");
    let backup: String = db
        .query_row(
            "SELECT value FROM legacy_backup WHERE key=?1",
            [KEYS[1]],
            |r| r.get(0),
        )
        .unwrap();
    assert_eq!(backup, legacy[KEYS[1]]);
}

#[test]
fn malformed_legacy_json_is_backed_up_and_existing_state_wins() {
    let mut db = open(Path::new(":memory:")).unwrap();
    save(&mut db, &values(&[(KEYS[0], r#"{"charName":"Nova"}"#)])).unwrap();
    let legacy = values(&[(KEYS[0], "{}"), (KEYS[1], "{broken"), ("unknown", "{}")]);
    let loaded = initialize(&mut db, &legacy).unwrap();
    assert_eq!(loaded[KEYS[0]], r#"{"charName":"Nova"}"#);
    assert!(!loaded.contains_key(KEYS[1]));
    assert!(!loaded.contains_key("unknown"));
    let backup: String = db
        .query_row(
            "SELECT value FROM legacy_backup WHERE key=?1",
            [KEYS[1]],
            |r| r.get(0),
        )
        .unwrap();
    assert_eq!(backup, "{broken");
}

#[test]
fn write_errors_roll_back_the_entire_batch() {
    let mut db = open(Path::new(":memory:")).unwrap();
    let original = values(&[(KEYS[1], "[]"), (KEYS[3], "{}")]);
    save(&mut db, &original).unwrap();
    db.execute_batch("CREATE TRIGGER reject_stats BEFORE UPDATE ON app_state WHEN NEW.key='mana.stats.v1' BEGIN SELECT RAISE(ABORT, 'test failure'); END;").unwrap();
    assert!(save(
        &mut db,
        &values(&[(KEYS[1], "[1]"), (KEYS[3], "{\"messages\":1}")])
    )
    .is_err());
    assert_eq!(initialize(&mut db, &BTreeMap::new()).unwrap(), original);
    assert!(save(&mut db, &values(&[(KEYS[0], "{}"), ("unknown", "{}")])).is_err());
    assert!(save(&mut db, &values(&[(KEYS[0], "{broken")])).is_err());
}

#[test]
fn failed_migration_can_be_retried_without_partial_data() {
    let mut db = open(Path::new(":memory:")).unwrap();
    db.execute_batch("CREATE TRIGGER reject_migration BEFORE INSERT ON metadata BEGIN SELECT RAISE(ABORT, 'test failure'); END;").unwrap();
    let legacy = values(&[(KEYS[0], "{}")]);
    assert!(initialize(&mut db, &legacy).is_err());
    let count: i64 = db
        .query_row("SELECT COUNT(*) FROM app_state", [], |r| r.get(0))
        .unwrap();
    assert_eq!(count, 0);
    db.execute_batch("DROP TRIGGER reject_migration").unwrap();
    assert_eq!(initialize(&mut db, &legacy).unwrap(), legacy);
}

#[test]
fn playtest_reports_persist_without_changing_artifacts() {
    let mut db = open(Path::new(":memory:")).unwrap();
    let expected = values(&[("mana.work.v1", "[]"), ("mana.playtests.v1", r#"[{"id":"r1","artifactId":"a1","outcome":"loss"}]"#)]);
    save(&mut db, &expected).unwrap();
    assert_eq!(initialize(&mut db, &BTreeMap::new()).unwrap(), expected);
    save(&mut db, &values(&[("mana.playtests.v1", "[]")])).unwrap();
    assert_eq!(initialize(&mut db, &BTreeMap::new()).unwrap(), values(&[("mana.work.v1", "[]"), ("mana.playtests.v1", "[]")]));
}

#[test]
fn reviewed_work_saves_independently_of_goals() {
    let mut db = open(Path::new(":memory:")).unwrap();
    let expected = values(&[("mana.goals.v1", "[]"), ("mana.work.v1", r#"[{"id":"a1","goalId":"g1","content":"draft"}]"#)]);
    save(&mut db, &expected).unwrap();
    assert_eq!(initialize(&mut db, &BTreeMap::new()).unwrap(), expected);
    save(&mut db, &values(&[("mana.work.v1", "[]")])).unwrap();
    assert_eq!(initialize(&mut db, &BTreeMap::new()).unwrap(), values(&[("mana.goals.v1", "[]"), ("mana.work.v1", "[]")]));
}

#[test]
fn goals_persist_and_delete_without_changing_chat() {
    let mut db = open(Path::new(":memory:")).unwrap();
    let expected = values(&[("mana.chat.v1", "[]"), ("mana.goals.v1", r#"[{"id":"g1","title":"Puzzle","status":"active"}]"#)]);
    save(&mut db, &expected).unwrap();
    assert_eq!(initialize(&mut db, &BTreeMap::new()).unwrap(), expected);
    save(&mut db, &values(&[("mana.goals.v1", "[]")])).unwrap();
    assert_eq!(initialize(&mut db, &BTreeMap::new()).unwrap(), values(&[("mana.chat.v1", "[]"), ("mana.goals.v1", "[]")]));
}

#[test]
fn relationship_timeout_state_and_chat_save_atomically() {
    let mut db = open(Path::new(":memory:")).unwrap();
    let original = values(&[("mana.chat.v1", "[]"), ("mana.initiative.v1", r#"{"pending":{"messageId":"opening"}}"#), ("mana.relationship.v1", r#"{"bond":30,"affection":50,"processedEvents":[]}"#)]);
    save(&mut db, &original).unwrap();
    db.execute_batch("CREATE TRIGGER reject_relationship BEFORE UPDATE ON app_state WHEN NEW.key='mana.relationship.v1' BEGIN SELECT RAISE(ABORT, 'test failure'); END;").unwrap();
    let next = values(&[("mana.chat.v1", "[1]"), ("mana.initiative.v1", r#"{"pending":null}"#), ("mana.relationship.v1", r#"{"bond":29.9,"affection":49.5,"processedEvents":["initiative:opening"]}"#)]);
    assert!(save(&mut db, &next).is_err());
    assert_eq!(initialize(&mut db, &BTreeMap::new()).unwrap(), original);
    db.execute_batch("DROP TRIGGER reject_relationship").unwrap();
    save(&mut db, &next).unwrap();
    assert_eq!(initialize(&mut db, &BTreeMap::new()).unwrap(), next);
}

#[test]
fn initiative_and_chat_save_together_and_roll_back_on_failure() {
    let mut db = open(Path::new(":memory:")).unwrap();
    let original = values(&[("mana.chat.v1", "[]"), ("mana.initiative.v1", r#"{"enabled":true,"pending":null}"#)]);
    save(&mut db, &original).unwrap();
    assert_eq!(initialize(&mut db, &BTreeMap::new()).unwrap(), original);
    db.execute_batch("CREATE TRIGGER reject_initiative BEFORE UPDATE ON app_state WHEN NEW.key='mana.initiative.v1' BEGIN SELECT RAISE(ABORT, 'test failure'); END;").unwrap();
    assert!(save(&mut db, &values(&[("mana.chat.v1", "[1]"), ("mana.initiative.v1", r#"{"pending":{"messageId":"opening"}}"#)])).is_err());
    assert_eq!(initialize(&mut db, &BTreeMap::new()).unwrap(), original);
}

#[test]
fn data_survives_reopening_and_newer_schemas_are_rejected() {
    let unique = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap()
        .as_nanos();
    let file = std::env::temp_dir().join(format!(
        "mana-store-test-{}-{unique}.sqlite3",
        std::process::id()
    ));
    let expected = values(&[(KEYS[0], r#"{"charName":"Nova"}"#), (KEYS[1], "[]")]);
    {
        let mut db = open(&file).unwrap();
        initialize(&mut db, &BTreeMap::new()).unwrap();
        save(&mut db, &expected).unwrap();
    }
    {
        let mut db = open(&file).unwrap();
        assert_eq!(
            initialize(&mut db, &values(&[(KEYS[1], "[1]")])).unwrap(),
            expected
        );
        db.execute_batch("PRAGMA user_version=4").unwrap();
    }
    assert!(open(&file).is_err());
    std::fs::remove_file(file).unwrap();
}
#[test]
fn followup_notes_persist_with_review_ids_without_changing_goals() {
    let mut connection = super::open(std::path::Path::new(":memory:")).unwrap();
    let raw=r#"{"notes":[{"id":"note","topic":"Name game","status":"pending","dueLocal":"2026-10-10T09:00","timeZone":"Asia/Singapore"}],"reviewedIds":["u1"]}"#;
    let values=std::collections::BTreeMap::from([("mana.followups.v1".into(),raw.into()),("mana.goals.v1".into(),"[]".into())]);
    super::save(&mut connection,&values).unwrap();
    let restored=super::initialize(&mut connection,&Default::default()).unwrap();
    assert_eq!(restored["mana.followups.v1"],raw);
    assert_eq!(restored["mana.goals.v1"],"[]");
}

#[test]
fn shared_activity_sessions_persist_without_changing_chat() {
    let mut connection = super::open(std::path::Path::new(":memory:")).unwrap();
    let raw=r#"{"sessions":[{"id":"story","kind":"story","status":"paused","turns":[{"role":"user","text":"A door opens"}]}],"selectedId":"story"}"#;
    let records=std::collections::BTreeMap::from([("mana.shared_activities.v1".into(),raw.into()),("mana.chat.v1".into(),"[]".into())]);
    super::save(&mut connection,&records).unwrap();
    let restored=super::initialize(&mut connection,&Default::default()).unwrap();
    assert_eq!(restored["mana.shared_activities.v1"],raw);
    assert_eq!(restored["mana.chat.v1"],"[]");
}
#[test]
fn chat_archive_survives_clearing_current_chat() {
    let mut connection = super::open(std::path::Path::new(":memory:")).unwrap();
    let raw = r#"[{"id":"archive","messages":[{"id":"u","role":"user","content":"Old chat"}]}]"#;
    let values = std::collections::BTreeMap::from([("mana.chat_archives.v1".into(),raw.into()),("mana.chat.v1".into(),"[]".into())]);
    super::save(&mut connection,&values).unwrap();
    let restored = super::initialize(&mut connection,&Default::default()).unwrap();
    assert_eq!(restored["mana.chat_archives.v1"],raw);
    assert_eq!(restored["mana.chat.v1"],"[]");
}
#[test]
fn thoughts_persist_without_changing_chat() {
    let mut connection=super::open(std::path::Path::new(":memory:")).unwrap();
    let raw=r#"{"enabled":true,"entries":[{"id":"t","text":"Curious about JSON"}]}"#;
    let values=std::collections::BTreeMap::from([("mana.thoughts.v1".into(),raw.into()),("mana.chat.v1".into(),"[]".into())]);
    super::save(&mut connection,&values).unwrap();
    let restored=super::initialize(&mut connection,&Default::default()).unwrap();
    assert_eq!(restored["mana.thoughts.v1"],raw);
    assert_eq!(restored["mana.chat.v1"],"[]");
}

#[test]
fn event_history_persists_separately() {
    let mut connection=super::open(std::path::Path::new(":memory:")).unwrap();
    let raw=r#"[{"eventId":"e","id":"goal","kind":"goal","title":"Learn","outcome":"completed","recordedAt":"2026-10-09T12:00:00Z"}]"#;
    let values=std::collections::BTreeMap::from([("mana.events.v1".into(),raw.into())]);
    super::save(&mut connection,&values).unwrap();
    let restored=super::initialize(&mut connection,&Default::default()).unwrap();
    assert_eq!(restored["mana.events.v1"],raw);
    assert!(!restored.contains_key("mana.chat.v1") || restored["mana.chat.v1"]=="[]");
}

#[test]
fn episodes_preserve_source_snapshot_independently_of_history() {
    let mut connection=super::open(std::path::Path::new(":memory:")).unwrap();
    let raw=r#"[{"id":"memory","content":"A close preview win","source":{"eventId":"e","id":"report"}}]"#;
    let values=std::collections::BTreeMap::from([("mana.episodes.v1".into(),raw.into()),("mana.events.v1".into(),"[]".into())]);
    super::save(&mut connection,&values).unwrap();
    let restored=super::initialize(&mut connection,&Default::default()).unwrap();
    assert_eq!(restored["mana.episodes.v1"],raw);
    assert_eq!(restored["mana.events.v1"],"[]");
}

#[test]
fn narrative_versions_preserve_evidence() {
    let mut connection=super::open(std::path::Path::new(":memory:")).unwrap();
    let raw=r#"[{"id":"n1","sources":[{"id":"memory"}]},{"id":"n2","parentId":"n1","version":2}]"#;
    super::save(&mut connection,&std::collections::BTreeMap::from([("mana.narratives.v1".into(),raw.into())])).unwrap();
    let restored=super::initialize(&mut connection,&Default::default()).unwrap();
    assert_eq!(restored["mana.narratives.v1"],raw);
}
