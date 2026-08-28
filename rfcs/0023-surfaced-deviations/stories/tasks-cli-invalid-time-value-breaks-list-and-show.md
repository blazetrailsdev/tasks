---
title: "tasks-cli-invalid-time-value-breaks-list-and-show"
status: draft
updated: 2026-08-28
rfc: "0023-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`pnpm tasks list` and `pnpm tasks show` currently fail for EVERY caller with a
bare `error: Invalid time value` and exit 1. Hit independently on 2026-08-28 by
the agent on PR #7159 and by that PR's reviewer, who had to review against the
PR body instead of the story files.

Root cause is in the tasks repo (`blazetrailsdev/tasks`), `src/readmodel.ts:21`:

```ts
return d ? new Date(`${d}T00:00:00.000Z`).toISOString() : null;
```

It assumes `stories.updated_on` is a bare `YYYY-MM-DD`. Three rows hold a full
nanosecond-precision RFC3339 timestamp instead:

```text
trim-active-model-model-to-api-and-access             2026-08-28T14:21:31.921891634Z
wire-attribute-methods-dependency-in-append-features-order  2026-08-28T14:21:35.853895613Z
seed-ar-attributes-before-init-internals              2026-08-28T14:21:28.044887806Z
```

For those, the template produces
`"2026-08-28T14:21:31.921891634ZT00:00:00.000Z"` → `Invalid Date` →
`.toISOString()` throws. One bad row takes down every read verb, because the
listing formats all rows.

Two things are wrong and both want fixing:

1. **The read path is not defensive.** `src/rfc-close.test.ts:117` already
   documents this exact failure class ("Invalid time value for every caller and
   the spawn loop stops"), so the hardening is precedented.
2. **Something writes a non-date into a date column.** Every in-repo writer
   slices to 10 chars (`verbs.ts:36`, `ingest.ts:293,338`, `rfc-close.ts:74`),
   so the value arrives from outside those paths — most likely an ingest of
   frontmatter whose `updated:` carried a full timestamp, passed through
   unvalidated. Nanosecond precision suggests a non-Node writer.

A second, cosmetically similar bug worth confirming while in here: a verb such
as `tasks done` prints its success line and THEN exits 1 on this same error, so
a wrapper reading the exit code reports the write as skipped when it landed.

## Acceptance criteria

- `src/readmodel.ts` normalises or rejects a non-`YYYY-MM-DD` `updated_on`
  without throwing, so one malformed row cannot break `list` / `show` for
  every story.
- The write path validates `updated_on` (and `updated_at`) on ingest, so a
  timestamp in a `updated:` frontmatter field cannot reach the column.
- The three rows above are repaired.
- A regression test covers a malformed `updated_on` surviving a `list`.
- Confirm whether a verb can exit non-zero after a successful write, and if so
  make the exit code follow the write.

Fix lands in the tasks repo, not trails (`pnpm tasks` is only the
`scripts/tasks/tasks.sh` shim).
