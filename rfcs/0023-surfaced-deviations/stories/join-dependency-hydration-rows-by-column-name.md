---
title: "Build join-dependency hydration test rows by column name, not hardcoded tN_rN offsets"
status: ready
updated: 2026-07-03
rfc: "0023-surfaced-deviations"
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

PR #4510 converged the pure-wiring join-dependency suites onto `fixtures({})`.
Under the warmed canonical schema, the hand-built `tN_rN` hydration rows in
`join-dependency-{belongs-to-dedup,duplicate-objects,extra-columns,nested-hydration}.test.ts`
must sit at the canonical column offsets (e.g. `comments.author_id` at `t1_r8`,
which forces `nested-hydration` to declare a 9-column canonical prefix on its
inline `Comment`). These offsets are hardcoded and will silently misalign if a
canonical `schema.rb` column order ever changes — the tests would pass on stale
offsets or fail cryptically.

## Acceptance criteria

- Replace the hardcoded `tN_rN` row literals with a small test helper that
  builds aliased rows from `{node: {columnName: value}}` using the
  JoinDependency alias map (`Aliases.columnAlias`), so tests never hardcode a
  column index.
- Drop the canonical-prefix column padding on the inline `Comment` (and similar)
  models once offsets are name-derived.
- No test renames; all four suites stay green alone and co-scheduled with
  schema-warming siblings.
