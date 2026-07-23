---
title: "weakened-assertion-restoration-sweep"
status: ready
updated: 2026-07-23
rfc: "0030-ar-test-compare-residual-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: 4
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`test:compare --assertions` surfaces a coherent cluster of weakened assertions:
tests where Rails asserts a concrete value/message but trails asserts a boolean
or a typeof. One sweep story (small LOC — each fix is restoring 1–3 assertion
values); split only if it balloons. Entries (Rails value → trails value):

- transactions_test.rb: "raising exception in callback rollbacks in save"
  ("Make the transaction rollback" → false); "mark transaction state as
  committed"/"rolledback" ("committed"/"rolledback" → true).
- readonly_test.rb: "cant save readonly record" ("Developer is marked as
  readonly" ×3 → booleans).
- strict_loading_test.rb: "strict loading violation can log instead of raise"
  ("log" → true).
- primary_keys_test.rb: "serial with quoted/unquoted sequence name"
  (nextval defaults → true).
- adapters/postgresql/uuid_test.rb: "uuid column default" ("gen_random_uuid()"
  → true).
- connection_adapters/schema_cache_test.rb: "columns (hash) for existent
  table" (count 3 → first column name).
- calculations_test.rb: "limit should apply before count" (Rails [3,3], trails
  [3,4] — possible REAL behavior divergence, investigate first); "no order by
  when counting all" and "should return integer average if db returns such"
  (value → typeof).
- finder_test.rb: "find some message with custom primary key" (full
  RecordNotFound message → count 2); "find one message on primary key" uses
  Car where Rails... (verify: Rails uses Car; trails uses Topic — converge
  model).
- active_record_schema_test.rb: "has primary key" ("version" → 1); "schema
  define with table name prefix" (7 → 1).
- sanitize_test.rb: "sanitize sql array handles empty statement" (Rails ""
  → trails "SELECT 1" — possible real divergence, investigate).
- json_serialization_test.rb: "should not call methods on associations that
  dont respond" (1 → post body string).
- validations/absence_validation_test.rb: "has one marked for destruction"
  (1 → true).
- migration_test.rb (6, mixed): notably "copied migrations at timestamp
  boundary are valid" (Rails 20231201101061 → trails "20231231235959" —
  investigate, likely real); "migration detection without schema migration
  table", "migration without transaction" (full message → true), "inserting a
  new entry into internal metadata" ("foo" → "bar"), "schema migration create
  table wont be affected by schema cache", "rename table with prefix and
  suffix".

For each: read the Rails test, restore the concrete expected value; where the
restored assertion fails, that is the real finding — fix impl or file a
follow-up deviation story rather than re-weakening.

## Acceptance criteria

- Listed tests assert Rails' concrete values (or a follow-up story exists for
  each genuine behavior divergence uncovered).
- `--assertions` value-mismatch entries for these files drop accordingly.
