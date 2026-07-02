---
title: "Phase 1: create_table canonical schema loader (schema.rb port), wire boot"
status: ready
updated: 2026-07-02
rfc: "0059-drop-defineschema-mirror-create-table"
cluster: null
deps: []
deps-rfc: []
est-loc: 250
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

RFC 0059 (drop-defineschema-mirror-create-table). **Guiding principle: Rails fidelity above all else.** Phase 1 of the rollout.

Replace the boot-time canonical-schema layout — today
`test-helpers/template-global-setup.ts` calls
`defineSchema(adapter, TEST_SCHEMA, {force:true})` — with a hand-written
schema-definition script that issues real `connection.createTable(name, opts,
t => { … })` calls (block API at
`connection-adapters/abstract/schema-statements.ts:237`), mirroring
`vendor/rails/activerecord/test/schema/schema.rb`'s
`ActiveRecord::Schema.define do … end` **line-for-line**. This is the
`Schema.define` equivalent and the single canonical source going forward; the
1881-line `TEST_SCHEMA` object is NOT kept as loader data (it is retired with
`defineSchema` in phase 4).

Keep the boot-once + truncate-reset + no-`DROP TABLE` behaviour (the perf win)
intact — it is orthogonal to `defineSchema`. Keep `defineSchema` working in
parallel for now so phases 2–3 can proceed incrementally.

## Acceptance criteria

- New `create_table`-based canonical loader ported faithfully from schema.rb;
  wired into `template-global-setup.ts` boot for all three adapters.
- Schema-dump parity: `schema-dumper` tests unchanged on sqlite + PG + MySQL
  (the loaded schema is byte-for-byte what `defineSchema(TEST_SCHEMA)` produced).
- `defineSchema` still functions (removed later); no test renames; `test:compare` >= 0.
