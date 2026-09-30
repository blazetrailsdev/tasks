---
title: "activerecord: InsertAll::Builder call + args rows (extract_types_from_columns_on, touch_model_timestamps_unless)"
status: ready
updated: 2026-09-30
rfc: "0174-activerecord-api-parity-100"
cluster: calls-args
packages: ["activerecord"]
deps: ["port-insert-all-extract-types-from-columns-on"]
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

`call-mismatches-exclude/activerecord/insert-all.json`: `extract_types_from_columns_on` omits `first`,
and **args** `touch_model_timestamps_unless` → `join` passes a separator Rails does not
(`vendor/rails/v8.0.2/activerecord/lib/active_record/insert_all.rb`, `InsertAll::Builder`). Both were measured only once parity:api stopped dropping
classes nested inside a same-file parent. `port-insert-all-extract-types-from-columns-on` (RFC 0023)
ports the missing memo; this story finishes the rows.

## Acceptance criteria

- [ ] Both bodies match Rails' calls and argument lists; rows deleted, shard removed.

## Verification

```bash
pnpm parity:api:calls && pnpm parity:api:calls:args
```
