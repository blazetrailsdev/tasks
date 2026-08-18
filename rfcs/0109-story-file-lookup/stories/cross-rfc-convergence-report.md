---
title: "Report cross-RFC file convergence"
status: done
updated: 2026-08-18
rfc: "0109-story-file-lookup"
cluster: file-lookup
packages: []
deps:
  - tasks-touching-command
deps-rfc: []
est-loc: 40
priority: 2
pr: 70
claim: "2026-08-18T16:04:41Z"
assignee: "cross-rfc-convergence-report"
blocked-by: null
---

## Context

The per-path query in `tasks-touching-command` answers "is _this_ file already
triaged?". This story adds the standing inverse: **which files have open stories
from more than one RFC**, i.e. where triage has already split across epics.

Measured on the current backlog: **157 files carry open stories from ≥2
distinct RFCs**, and **129 of them (82%) involve `0023-surfaced-deviations`** —
the catch-all. Those are findings dumped into the junk drawer while a named epic
already owned the file, and re-homing them is the payoff. The remaining 28 are
epic-vs-epic and are the genuinely surprising ones, e.g.
`scripts/api-compare/lint-call-mismatches.ts` (0025, 0097, 0106),
`packages/globalid/src/signed-global-id.ts` (0025, 0069, 0097),
`packages/activerecord/src/ruby-truthy.ts` (0025, 0082).

`0023-surfaced-deviations` must **not** be hardcoded in the CLI — a magic slug
rots. A generic `--exclude-rfc <slug>` gets the same result and stays honest.

## Acceptance criteria

- [ ] `crossRfcConvergences(index, opts)` exported from `scripts/cli.ts`:
      inverts `story_paths` into path → open stories, keeps paths whose stories
      span ≥2 distinct RFCs, sorts by story count descending.
- [ ] Exposed as `pnpm tasks touching --conflicts`, with `<path>` optional when
      `--conflicts` is passed.
- [ ] `--exclude-rfc <slug>` filters that RFC out **before** the ≥2 threshold is
      re-evaluated, so a path shared by only the excluded RFC and one other
      disappears rather than lingering as a one-RFC "convergence".
- [ ] `"exclude-rfc"` added to the `valueFlags` array; `usage()` updated.
- [ ] `--json` supported, consistent with the other read verbs.
- [ ] No RFC slug is hardcoded anywhere in the implementation.

## Definition of done

Special-casing `0023-surfaced-deviations` in code does not close this story,
however convenient the 82% figure makes it look.

## Verification

```bash
pnpm tasks touching --conflicts | wc -l                       # ~157 rows
pnpm tasks touching --conflicts --exclude-rfc 0023-surfaced-deviations
# ~28 epic-vs-epic rows, including lint-call-mismatches.ts and signed-global-id.ts
pnpm test
```

## Notes

The output doubles as a backlog-hygiene worklist: each 0023 row is a candidate
for re-homing into the epic that already owns the file. Consider running it once
after landing and filing the re-homing sweep as its own story under
`0023-surfaced-deviations` rather than doing it inline here.
