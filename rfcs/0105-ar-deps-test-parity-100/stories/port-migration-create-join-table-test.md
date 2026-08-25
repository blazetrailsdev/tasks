---
title: "Port migration/create_join_table_test.rb (19 missing)"
status: ready
updated: 2026-08-13
rfc: "0105-ar-deps-test-parity-100"
cluster: name-gap
packages:
  - "activerecord"
deps: []
deps-rfc: []
est-loc: 400
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

ActiveRecord's entire remaining name-level test gap is the migration cluster:
169 of its 181 remaining tests sit under
`vendor/rails/activerecord/test/cases/migration/`, measured 2026-08-13 with
`pnpm parity:test -- --cached --package activerecord`. 57 of those are
`compatibility_test.rb`, which this RFC excludes as won't-do (see
`exclude-migration-compatibility-tests-as-wont-do`); the rest are real ports.
Our counterparts live under `packages/activerecord/src/migration/`. Read the
whole Rails file before porting (test names are the parity key and must not be
reworded), use `pnpm rails:find <name>` to map a name to its `file:line`, and
take tables/columns from the canonical schema
(`packages/activerecord/src/test-helpers/test-schema.ts`, mirroring
`vendor/rails/activerecord/test/schema/schema.rb`) via `fixtures({ ... })` —
never a bespoke table.

This story covers **19 missing tests**:

- `vendor/rails/activerecord/test/cases/migration/create_join_table_test.rb` — 19 missing

## Acceptance criteria

- Every Rails test listed above exists in the convention TS file
  `pnpm parity:test -- --package activerecord` names for it, with the Rails name
  verbatim, and passes on all three adapters CI runs.
- `pnpm parity:test` reports 0 missing for these files; activerecord's percent
  rises by the corresponding amount and no other file regresses.
- Adapter-conditional Rails arms (`current_adapter?(:PostgreSQLAdapter)` and
  friends) are ported as arms, not dropped — a dropped arm is the single most
  common one-lane CI failure in this repo.
- No new `unported-files` rows, no `it.skip` stubs standing in for ports.
- `pnpm parity:api:calls` and `pnpm parity:api:calls:args` stay green if a
  ported method body is touched.
