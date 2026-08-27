---
title: "Ratchet the rebuildCanonicalTables caller list: no new call sites"
status: done
updated: 2026-08-27
rfc: "0079-drop-rebuild-canonical-tables"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: 2
pr: 7112
claim: "2026-08-27T02:01:16Z"
assignee: "ratchet-rebuild-canonical-tables-callers"
blocked-by: null
closed-reason: null
---

## Context

RFC 0070 froze its backlog with `eslint/require-canonical-rebuild-exclude.json`;
this RFC needs the same ratchet in the opposite direction. Today the
`require-canonical-rebuild` rule (eslint/require-canonical-rebuild.mjs) MANDATES
calling `rebuildCanonicalTables` after a canonical-table drop, so the helper's
caller count can only grow — and it has: three new sites appeared after this
story was written (`migration/exclusion-constraint.test.ts:34`,
`migration/rename-table.test.ts:44`, `migration/unique-constraint.test.ts:26`),
which is the concrete case for landing this before the burndown. Freeze the
current caller list (RFC README baseline; measured mechanically against
`origin/main` at `f5d2641f6`: 26 sites across 22 files) in a checked-in
manifest and fail lint when a file outside it calls
`rebuildCanonicalTables` — new suites must use `fixtures({ ... })` or fix their
contamination source instead. The list only shrinks as burndown stories land.

## Phase-1 attribution (2026-08-26)

Confirmed as the highest-value first landing. All three sites that appeared
after this story was written — `migration/exclusion-constraint.test.ts:34`,
`migration/rename-table.test.ts:44`, `migration/unique-constraint.test.ts:26` —
are group A: each `force`-creates or renames a canonical table and was then
_required_ by `require-canonical-rebuild` to add the call. The mandate is the
growth mechanism, exactly as the story argues.

Baseline for the frozen manifest is the 26-site table in the RFC README
inventory: **26 sites across 22 files**, measured against `origin/main` at
`f5d2641f6`. The earlier "26 across 23" conflated the pre- and post-#7109
trees — it was 27/23 before #7109 removed the uniqueness-suite site, and 26/22
after. See the count-correction note in the RFC README.

## Acceptance criteria

- A lint (or manifest-diff check wired into CI) fails on any new
  `rebuildCanonicalTables` call site outside the frozen baseline list.
- Removing an entry is a one-line manifest deletion in the burndown PR.
- The rule's message points at this RFC and the fixtures({}) alternative.
