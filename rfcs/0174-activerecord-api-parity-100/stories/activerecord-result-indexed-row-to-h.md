---
title: "activerecord: Result::IndexedRow#to_h"
status: ready
updated: 2026-09-30
rfc: "0174-activerecord-api-parity-100"
cluster: api-surface
packages: ["activerecord"]
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`result.rb → result.ts` scores 27/28; the miss is `Result::IndexedRow#to_h`
(`vendor/rails/v8.0.2/activerecord/lib/active_record/result.rb:86`), which zips `@column_indexes` with `@row` into a Hash.
`load-from-sql-iterates-indexed-rows` (RFC 0023) moves `_load_from_sql` onto `indexed_rows`, which
is where `to_h` gets called.

## Acceptance criteria

- [ ] `IndexedRow#toH` is ported with Rails' body; `result.rb` scores 28/28.

## Verification

```bash
pnpm build && pnpm parity:api && pnpm parity:api:calls && pnpm parity:api:calls:args
```
