---
title: 'activerecord: after re-establishing a connection the primary-key latch is lost but _schemaLoaded is kept, so an id-less table inserts RETURNING "id"'
status: draft
updated: 2026-10-03
rfc: "0174-activerecord-api-parity-100"
cluster: null
packages: ["activerecord"]
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rails latches a model's primary key on first read and keeps it until the
schema is reset: `vendor/rails/v8.0.2/activerecord/lib/active_record/attribute_methods/primary_key.rb:80-83`
(`reset_primary_key if PRIMARY_KEY_NOT_SET.equal?(@primary_key)`), with
`load_schema` short-circuiting on `@schema_loaded` (`model_schema.rb:534-546`)
and both reset together by `reset_column_information` /
`reload_schema_from_cache` (`model_schema.rb:523-530`).

trails lets the two drift apart across a reconnect. Found in trailmap
(blazetrailsdev/trailmap#30): a suite that re-runs
`Base.establishConnection(":memory:")` + migrations in `beforeEach`, then
`loadSchema()` on each model, sees a join model on an id-less table
(`createTable(..., { id: false })`) lose its own `_primaryKey` latch (it reads
as inherited `"id"`) while `_schemaLoaded` stays true. `loadSchema` therefore
returns early (`model-schema.ts:464`), the new pool's schema cache stays cold,
and the cold read in `getPrimaryKeyAttr`
(`attribute-methods/primary-key.ts:160`) answers the `"id"` convention without
latching, so `create` emits `INSERT ... RETURNING "id"` and SQLite raises
`no such column: "id"`. It only appears when an earlier test in the same
process has run queries; a test run alone passes.

trailmap works around it by calling `resetColumnInformation()` before each
`loadSchema()`.

## Converged shape

A model's primary-key latch and its schema-loaded flag live and die together,
as `@primary_key` and `@schema_loaded` do in Rails: whatever clears the latch on
reconnect also clears `_schemaLoaded`, or neither is cleared. First find what
clears `_primaryKey` on `establishConnection`.

## Acceptance criteria

- [ ] Reproduced in `packages/activerecord`: establish, migrate, `loadSchema`, run a query; re-establish a fresh database, migrate, `loadSchema`; `create` on an id-less-table model succeeds without `resetColumnInformation`.
- [ ] The latch and the flag are cleared together, at the sites Rails clears them.
- [ ] trailmap's `resetColumnInformation` call in `loadModelSchemas` can be removed.
