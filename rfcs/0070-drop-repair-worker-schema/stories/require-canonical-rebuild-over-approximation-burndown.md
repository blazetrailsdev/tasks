---
title: "Burn down require-canonical-rebuild's three documented over-approximations"
status: ready
updated: 2026-07-28
rfc: "0070-drop-repair-worker-schema"
cluster: null
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

`require-canonical-rebuild` (`eslint/require-canonical-rebuild.mjs`) reports
`sweepReachesCanonical` when a file drops tables by a runtime-computed name and
a catalogue query in it names a canonical table. Landed in PR #5519, where it
caught the `items` regression that made
`fixtureRegistry seeds against TEST_SCHEMA` fail intermittently on a PG shard.

Its detection is deliberately an over-approximation, documented in the rule's
`meta.docs.description`. Repo-wide it reports **0** today, but three
over-reports are reachable by ordinary future edits, and the only silencing
route is `eslint/require-canonical-rebuild-exclude.json`, which is documented
as two _permanent_ groups rather than a suppression backlog:

1. **The array-literal path does not require the array to be the filter list.**
   A canonical name in any array literal reports if the file both executes a
   catalogue query and drops by a swept name. Added so a filter list built in
   JS is not invisible — the real shape at
   `connection-adapters/sqlite3-adapter.ts:2150`, which interpolates a quoted
   name into the catalogue query.
2. **The name scan is not scoped to the SELECT the drop loop iterates.** A
   canonical name quoted in a catalogue probe that does not feed the loop still
   reports. Scoping needs dataflow from the loop variable back to its iterable's
   initializer; rejected during review as more machinery than the guarded shape
   warranted, and because a sweep's filter and its DROP are often written
   against different variables, so pairing them trades over-report for misses.
3. **`isSinkDerived` counts any `SQL_SINKS` call as a row source**, so a fixed
   name merely read back from the database
   (`const scratch = await adapter.execute("SELECT gen_scratch_name()")`) arms
   the check next to an unrelated catalogue probe, though nothing is swept.

All three are stated in `meta.docs.description`; this story is the tracking
anchor so they are not inherited silently.

## Acceptance criteria

- Re-measure repo-wide: if still 0 reports and no file has needed an
  exclude-file entry for an over-report, close as no-work with the count
  recorded — a documented over-approximation that never fires is an acceptable
  outcome, an untracked one is not.
- If any over-report has fired, tighten the responsible path rather than adding
  an exclude entry: scope the array-literal path to arrays that reach a sink
  argument, and/or require the sink-derived value to be a row property rather
  than a scalar.
- Do NOT scope the name scan to the iterated SELECT without evidence that the
  filter and DROP share a variable in practice; the review rejected it as
  trading over-reports for misses.
- Any change must keep the PR #5519 regression case reporting: the pre-fix
  `postgresql-adapter.trails.test.ts` sweep naming `items`.
