---
title: "Drop the dumper's duplicate conciseOptions and read IndexDefinition directly"
status: closed
updated: 2026-10-14
rfc: "0189-activerecord-surfaced-deviations"
cluster: null
packages:
  - "activerecord"
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: "rfc-refine 0189 (2026-10-14, trails origin/main 03da862b8a): Landed in trails#8715 (8531daa85f): `git grep conciseOptions origin/main -- packages/activerecord/src/schema-dumper.ts` is empty."
---

## Context

`schema-dumper.ts:132` carries a module-level `conciseOptions(columns, options)`
helper that `indexParts` applies to `index.lengths` / `index.orders` /
`index.opclasses` before formatting. Rails' `index_parts`
(`activerecord/lib/active_record/schema_dumper.rb:265-277`) reads those
attributes straight off the `IndexDefinition` — the collapse already happened in
`IndexDefinition#concise_options`
(`connection-adapters/abstract/schema-definitions.ts:667`,
`activerecord/lib/active_record/connection_adapters/abstract/schema_definitions.rb:65`)
at construction time.

The dumper's copy predates #5877 (adapters returning real `IndexDefinition`
instances) and #5890 (the schema cache rehydrating them), when the dumper could
receive plain rows that had never been collapsed. Both paths now hand it real
instances, so the second collapse is a no-op at best — and it is a second
implementation of the same rule that can drift from the class's.

Noted while fixing the expression-index idempotence bug in #5891.

## Acceptance criteria

- `indexParts` reads `index.lengths` / `index.orders` / `index.opclasses`
  directly, as Rails does.
- The module-level `conciseOptions` in `schema-dumper.ts` is deleted (or, if a
  `SchemaSource` that is not an adapter can still supply uncollapsed maps,
  that case is identified and the helper's continued existence justified at the
  call site rather than assumed).
- `schema-dumper.test.ts` and the sqlite3 / migration dumper suites pass with no
  change to emitted schema output.
