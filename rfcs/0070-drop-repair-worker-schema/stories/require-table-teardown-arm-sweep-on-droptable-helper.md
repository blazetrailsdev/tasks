---
title: "require-table-teardown: arm a sweep on the dropTable() helper form"
status: claimed
updated: 2026-07-29
rfc: "0070-drop-repair-worker-schema"
cluster: null
deps: []
deps-rfc: []
est-loc: 90
priority: null
pr: null
claim: "2026-07-29T01:55:45Z"
assignee: "require-table-teardown-arm-sweep-on-droptable-helper"
blocked-by: null
closed-reason: null
---

## Context

`require-table-teardown` (`eslint/require-table-teardown.mjs`) recognises the
drop half of a catalogue sweep only in raw SQL: `hasDynamicDropName` scans
template quasis of `SQL_SINKS` calls for `DROP TABLE` followed by an
interpolation in the table-name position. A sweep that drops through the
schema-statement helper instead — `for (const t of rows) await
adapter.dropTable(t.tablename)` — arms nothing, so every raw `CREATE TABLE
<prefix>…` in that file still reports `missingTeardown`.

`require-canonical-rebuild` already detects both spellings: its doc
(`eslint/require-canonical-rebuild.mjs:30`) states "BOTH spellings arm only on
a swept name: the `dropTable()` argument, and at least one substitution of a
template containing DROP TABLE, must trace back to a for-of/for-in binding, an
inline callback parameter, or a variable initialized OR ASSIGNED from an
execution sink". The resolver that does it lives in that file and is the
obvious thing to share or mirror.

This is an under-accepting gap (noise, not a leak), documented in the prefix-
sweep section of the rule header's KNOWN GAPS paragraph. It matters because the
helper form is the form CLAUDE.md steers tests toward, so a file written the
recommended way gets the worse lint outcome.

## Acceptance criteria

- A `dropTable()` call whose table-name argument traces back to a sink-derived
  row binding arms a sweep, on the same footing as the raw-SQL spelling.
- A fixed-name `dropTable("ex_foo")` still arms nothing — the argument must be
  sweep-bound, or the rule stops catching bespoke tables that outlive a test.
- Prefer sharing `require-canonical-rebuild`'s existing sweep-binding resolver
  over a second implementation; if it cannot be shared, say why in the PR body.
- Rule tests pin: a helper-form sweep satisfying prefixed creates, and a
  fixed-name `dropTable` arming nothing.
- The header's KNOWN GAPS paragraph drops the helper-form clause.
