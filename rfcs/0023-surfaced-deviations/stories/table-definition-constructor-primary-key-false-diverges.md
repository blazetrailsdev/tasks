---
title: "TableDefinition constructor still treats primaryKey: false as id: false, disagreeing with createTable"
status: closed
updated: 2026-08-09
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: "Already done: the pkFalse computation is gone from abstract/schema-definitions.ts and the 'treats primaryKey: false same as id: false' assertion no longer exists in schema-definitions.test.ts."
---

## Context

PR #5629 fixed `buildCreateTableDefinition` so that `primaryKey: false` no
longer suppresses the primary key column: Rails guards only on `id`, then
resolves `pk = primary_key || Base.get_primary_key(table_name.singularize)`
(`vendor/rails/activerecord/lib/active_record/connection_adapters/abstract/schema_definitions.rb:397`),
so a falsy `primary_key` falls back to the conventional name.

The `TableDefinition` **constructor** was deliberately left alone and still
carries the opposite, trails-only contract —
`packages/activerecord/src/connection-adapters/abstract/schema-definitions.ts`
computes `pkFalse = tdOptions.primaryKey === false` and passes `false` as the
id argument, so `new TableDefinition("t", { primaryKey: false })` emits no PK
column. It is asserted directly by
`packages/activerecord/src/connection-adapters/abstract/schema-definitions.test.ts:377`
("treats primaryKey: false same as id: false").

So the two entry points now disagree: through `createTable` a
`primaryKey: false` table gets an `id` column, through the bare constructor it
does not. Rails has one behaviour. It was out of scope for #5629 (changing it
means changing an assertion that predates the PR, with no new evidence at the
time), but the split is a trap for the next person.

Note the constructor is not on the `buildCreateTableDefinition` path — that
call site passes `id: false` and does not forward `primaryKey` — so converging
the constructor is self-contained.

## Acceptance criteria

- The `TableDefinition` constructor treats `primaryKey: false` the way Rails
  does: it does not suppress the PK column; only `id: false` does.
- `schema-definitions.test.ts:377` updated to assert the Rails behaviour, with
  the Rails `file:line` cited in the test.
- Any caller relying on the old spelling is migrated to `id: false`; grep for
  `primaryKey: false` outside `test-schema.ts` (whose `primaryKey: false` meta
  is translated to `id: false` by the canonical loader and is unaffected).
- A test asserts both entry points now agree, and it fails on the pre-fix
  implementation.
