---
title: "Replace invented insert-all unknown-attribute guard with schema-cache columns_hash check"
status: done
updated: 2026-08-30
rfc: "0113-branch-and-guard-parity"
cluster: invented-arm
deps: []
deps-rfc: []
est-loc: 90
priority: null
pr: 7274
claim: "2026-08-30T22:34:09Z"
assignee: "insert-all-unknown-attribute-guard-via-schema-cache"
blocked-by: null
closed-reason: null
---

## Context

Rails raises `UnknownAttributeError` from `InsertAll::Builder#types`, via
`extract_types_from_columns_on(model.table_name, keys: keys_including_timestamps)`
checked against `schema_cache.columns_hash` at SQL-build time
(`vendor/rails/activerecord/lib/active_record/insert_all.rb:239`).

`packages/activerecord/src/insert-all.ts` instead has a trails-invented
`verifyAttributeNamesAreKnown()` called from the constructor, which checks the
model's declared attribute set plus a hand-maintained
`TIMESTAMP_ATTR_ALLOWLIST` — and **self-disables** with `if (known.size === 0)
return;` when the schema has not been reflected yet. So the guard silently does
nothing on a cold model, and its allowlist duplicates knowledge that the schema
cache already has.

PR #5331 split this out of `verifyAttributes` (which is now Rails-faithful and
runs per row inside `mapKeyWithValue`); the invented guard was left as-is.

## Acceptance criteria

- The unknown-attribute check runs against `schemaCache.columnsHash(tableName)`
  at Rails' call site, keyed on `keysIncludingTimestamps`.
- `TIMESTAMP_ATTR_ALLOWLIST` and the `known.size === 0` escape hatch are gone.
- `insert-all.test.ts` UnknownAttributeError cases still pass.

## Re-homed from `0023-surfaced-deviations` (2026-08-18)

Moved by the RFC 0023 backlog triage pass into `0113-branch-and-guard-parity`, which was carved out
of that register for this deviation class. Nothing about the finding changed —
every Rails and trails `file:line` citation above is as originally filed.
