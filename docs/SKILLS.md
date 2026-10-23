# Skills and reviewed coding evidence

**More → Skills** keeps ordinary practice counts separate from coding assessments. Work/activity practice records retain their original milestones. Coding reviews do not increase those counts or wardrobe coding levels, relationship stats, model weights or goals.

## Record a coding review

1. In Code playground, save a game version, manually Run/Stop it, review the result and save its run report as Worked or Needs a fix. Smoke reports and Not assessed reports do not qualify.
2. Open Skills → Coding evidence. Choose the exact-source manual report, then movement, persistent state, scoring, restart or power-up behavior.
3. Choose Demonstrated in this example / Needs more work. Write what you observed and explicitly confirm the limited review, then Save coding review.

A demonstrated result requires a Worked manual report with frames, ending normally (Stop or session limit). Movement also needs recorded arrow input; restart needs Space input. These measurements only support that a relevant test was attempted—the user's observation is the assessment. Needs-work can retain a reviewed failing manual run. A report must match saved game source exactly. One review per report/check prevents double counting; the same report can support distinct checks if the user actually reviewed them.

The summary shows the latest review per area and how many of five areas have a demonstrated example in that latest review. It is not a mastery grade, calibrated model capability, or proof of general skill. Later needs-work review changes that area's latest summary while preserving history. Deleting a review recalculates the summary and never deletes its game/report.

## Persistence and limits

Reviews use optional assessment metadata in existing mana.skills.v1 records. Old practice records and backups remain compatible. Exact tested source, selected game/version metadata, manual run measurements/notes and user observation survive source deletion, restart and backup/restore. Up to50 coding reviews share the existing200 total skill-record limit; limits block new reviews without pruning. Original game/report must still exist to create a new assessment, but saved snapshots stand independently afterward.

Relevant ordinary chat questions about skills/practice/coding include bounded summaries of reviewed examples. They distinguish user assessments from independent verification and exclude full code from ordinary skill context. No automatic mastery, grades, experience points or behavior/model-weight changes.

2026-10-19 validation:221 frontend tests passed/2 optional skipped; frontend/native builds passed. New tests cover exact source/manual evidence eligibility, rejection of smoke/unreviewed/empty or mismatched sources, duplicate prevention, required key evidence, separate practice counts, latest-review recalculation, backup/restart snapshots, old-record compatibility and invalid-backup rejection. No model generation was needed. Live UI/restart acceptance pending.

2026-10-19 acceptance: user confirms coding evidence and playable game export both passed. Current supported workflows accepted; broader proficiency/security guarantees remain out of scope.
