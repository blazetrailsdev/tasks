---
title: "Ratchet the rebuildCanonicalTables caller list: no new call sites"
status: ready
updated: 2026-07-26
rfc: "0079-drop-rebuild-canonical-tables"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: 2
pr: null
claim: null
assignee: null
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
current caller list (RFC README baseline, re-verified 2026-08-09: 26 sites
across 23 files) in a checked-in manifest and fail lint when a file outside it calls
`rebuildCanonicalTables` — new suites must use `fixtures({ ... })` or fix their
contamination source instead. The list only shrinks as burndown stories land.

## Acceptance criteria

- A lint (or manifest-diff check wired into CI) fails on any new
  `rebuildCanonicalTables` call site outside the frozen baseline list.
- Removing an entry is a one-line manifest deletion in the burndown PR.
- The rule's message points at this RFC and the fixtures({}) alternative.
