---
title: "Give the canonical registry schema.rb's standalone add_foreign_key form (undo the students hoist)"
status: draft
updated: 2026-08-27
rfc: "0023-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 200
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`vendor/rails/activerecord/test/schema/schema.rb` declares its two foreign keys
as _standalone statements after_ the tables they join:

- `schema.rb:100` — `add_foreign_key :authors, :author_addresses, deferrable: :immediate`
- `schema.rb:715-726` — `create_table :lessons_students`, then
  `create_table :students`, then
  `add_foreign_key :lessons_students, :students, on_delete: :cascade, deferrable: :immediate`

The canonical registry
(`packages/activerecord/src/support/canonical-schema.ts`,
`buildCanonicalRegistry`) has no statement form at all: a `define(name, meta,
fn)` entry is the only thing it can record, so every FK has to ride _inline_
inside a `create_table` block via `t.foreignKey`. That forces the referenced
table to be created first, which is why PR #7129 had to hoist
`define("students", ...)` **above** `define("lessons_students", ...)` —
inverting schema.rb's own order — and mirror the same inversion in
`TEST_SCHEMA`. Both sites carry a comment citing schema.rb and the reason.

This is a transcription-order deviation from schema.rb, not a Rails semantic
difference: the resulting DDL is equivalent. It is tracked so the registry can
grow the missing shape rather than accumulate more hoists — the same forcing
function will apply to every future standalone `add_foreign_key`.

## Converged shape

Give the registry a post-`create_table` statement entry — the analogue of
schema.rb's bare `add_foreign_key` line — so a canonical FK can be declared at
its schema.rb position with the referenced table still declared after it, and
applied in a second pass at the end of `loadCanonicalSchema`. Then:

- restore schema.rb's order: `lessons_students` (schema.rb:715-718) ahead of
  `students` (schema.rb:720-724), in `canonical-schema.ts` and in
  `test-helpers/test-schema.ts`, dropping the two hoist comments;
- keep `canonicalForeignKeyDependents()` seeing the edge (it currently replays
  `t.foreignKey` calls only), so `rebuildCanonicalTables` still widens a
  `students`-touching rebuild to include `lessons_students`;
- keep `rebuildCanonicalTables` re-laying the FK when it rebuilds either table,
  and `schema-file-generator.ts` emitting it.

## Acceptance criteria

- [ ] `canonical-schema.ts` and `test-helpers/test-schema.ts` declare
      `lessons_students` before `students`, matching schema.rb:715-724.
- [ ] The `lessons_students -> students` FK (schema.rb:726) is still laid, still
      seen by `canonicalForeignKeyDependents()`, and still survives a
      `rebuildCanonicalTables` of either table.
- [ ] `pnpm parity:schema` clean (`transcription-drift=0`).
- [ ] AR suites green on SQLite, PG and MySQL/MariaDB.
