---
title: "arity: collapse required-kwargs bundle vs single TS options object"
status: draft
updated: 2026-07-25
rfc: "0072-api-compare-parity-burndown"
cluster: api-compare-tooling
deps: []
deps-rfc: []
est-loc: 100
priority: 10
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`scripts/api-compare/arity.ts:189-232` (`positionalArity`) counts each Ruby
_required_ keyword (`key:` with no default) as one required positional slot.
The port's convention bundles all kwargs into ONE trailing options object, so
any Ruby method with ≥2 required kwargs can never match its faithful TS port.

8 of the 79 activerecord entries in `output/arity-mismatches.json` are this
shape:

- `perform_query` ×4 — Ruby
  `vendor/rails/activerecord/lib/active_record/connection_adapters/abstract/database_statements.rb:561`
  `(raw_connection, sql, binds, type_casted_binds, prepare:, notification_payload:, batch:)`
  → min 7 (6 for the pg/mysql2/sqlite3 overrides where `batch:` defaults);
  TS `packages/activerecord/src/connection-adapters/abstract/database-statements.ts:1859`
  and `postgresql/database-statements.ts:123`
  `(rawConnection, sql, binds, typeCastedBinds, options?)` → max 5. Faithful
  port, flagged anyway.
- `batch_on_loaded_relation` / `batch_on_unloaded_relation` ×2 files
  (`relation.rb` / `relation/batches.rb`) — Ruby
  `vendor/rails/activerecord/lib/active_record/relation/batches.rb`
  all-kwargs signatures (6 and 9 required kwargs) vs TS single `opts`.

The existing `hasKeywords` slack (arity.ts:234-239) only grants +1 max slot
for _optional_ kwargs; required kwargs get no bundling treatment.

## Acceptance criteria

- `positionalArity` (or a new candidate form in `arityMatches`) models the
  kwargs→options-object convention for required kwargs: e.g. collapse the
  whole required-kwarg group to one required slot as an additional candidate
  form, preserving the existing guarantee that extra forms only ever _gain_ a
  match (arity.ts:16-18).
- `arity.test.ts` covers: multiple required kwargs vs single TS options param
  (match), and a genuine positional-count mismatch that must still be flagged.
- `output/arity-mismatches.json` regenerated: the 8 entries above disappear;
  no previously-matched pair regresses.
