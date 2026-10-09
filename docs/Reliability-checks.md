# Reliability pass: checks when you return

These checks use the existing Mana window. Export a backup before testing any replacement.
The automated suite checks data handling and failure paths; these steps check the live UI.

## Saved data and recovery

1. Stop the model and open Settings. Check the Saved data overview counts.
2. Open Data checks. A deleted goal or revision parent can legitimately explain a note;
   the checks never delete or repair records.
3. Export a backup, then choose that same file to restore. Compare the Current and Backup columns.
4. Cancel preview to verify that selection alone replaces nothing.
5. If testing restore, confirm replacement. Reopen Settings after reload and expand Safety backups.
   Preview the newest safety copy; it should contain the state from before replacement.
   Selecting that copy opens a preview without applying it.

Safety copies are retained in the Mana app-data `backups` folder. The latest twenty appear in
Settings; older files are kept. They include private conversations and local paths. No model
files or avatar images are copied. Restoring requires saving the safety copy first.

## Shared activities

1. Open Activities → Word chain with the model off. Start with apple and play earth.
   Mana's word should begin with H. Try an invalid first letter or repeat and check that the turn
   is rejected without changing the transcript. Pause, reopen, and resume the saved game.
2. Choose Shared story. Start a session and save your first paragraph before starting the model.
   Request Mana's paragraph after the model is ready. Check the next user turn becomes available.
3. Stop one model contribution partway through. Your saved turn should remain pending and retryable,
   with no partial model paragraph accepted. Close/reopen or restart to verify persistence.
4. Choose Creative challenge, save a response and request optional feedback. Finish the session.
5. Select earlier sessions from the history dropdown. Starting new sessions must not erase old ones.
6. Export/preview a backup; Activity sessions and Paused activities should appear in the counts.

These activities do not award progression or generate memory suggestions/diary sources. Story
events are fictional; word-chain user spelling is not verified by a dictionary.

## Follow-up notes

1. Send “Let's talk about our game tomorrow” and open Follow-ups when its suggestion count appears.
2. Review the topic, source message, date, time and timezone. Save it; a proposal alone is not scheduled.
3. For a quick check, edit the note to a past time and enable initiative in State. Use Start a conversation
   now after closing Follow-ups. Existing pause checks still apply to manual starters.
4. Reopen Follow-ups. A successful starter marks the note as included in context, while leaving it pending.
5. Mark it done, postpone to tomorrow or dismiss it. Reopen is available on archived notes.
6. Export/preview a backup and confirm pending/all follow-up counts appear.

Automatic starters honor quiet hours and randomized timing. A note is not an exact-time alarm and
will not run while the app is closed. The model may fail to mention the supplied topic.

## Work library

1. Open Goals and scroll to Saved work.
2. Latest version in each family is shown initially. Turn off the checkbox to inspect history.
3. Search for a title, goal or phrase inside an artifact. Try the type filter.
4. Clear search and restore All types. All older versions should still exist.

Latest-family selection occurs before search. A phrase found only in an older version will
appear when latest-only is disabled. Filters do not modify work or playtest reports.

## Daily journal evidence

1. Have a short conversation and write or rewrite today's daily journal.
2. Expand Recorded chat evidence on the saved entry. Check the speaker names and timestamps.
3. Future entries retain up to twelve sampled excerpts. Those excerpts remain with the entry
   if chat is cleared, or the diary entry is moved to Recently deleted.
4. Rewrite can use those retained excerpts. Restore from Recently deleted preserves them.

Older entries have no reconstructed excerpts. Permanent deletion removes the entry and its
copies of evidence. Diary prose is model-generated; an assistant statement does not prove
physical actions, code execution, or events outside chat.

## Chat usability and incomplete replies

1. During a reply, scroll up to read older messages. New tokens should not pull you to the bottom.
2. Use Jump to latest to resume following the reply. Sending a message also returns to the latest turn.
3. Stop a reply after some text appears. It should be labelled incomplete rather than accepted.
4. Continue chatting. Failed/stopped reply text is excluded from later model history, memory
   suggestions and journal evidence; it remains visible for inspection.
5. Repeat the busy → return test. If correction is needed, a role reversal should be labelled
   Incorrect welcome-back roles in Reply diagnostics, rather than Repeated wording.

Phrase guards can miss paraphrases. No live model quality claim is implied by passing unit tests.
