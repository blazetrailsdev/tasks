---
title: "upsert_all and the bulk-write wrappers name their first parameter attributes"
status: done
updated: 2026-08-14
rfc: "0096-naming-identifier-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
pr: 6380
claim: "2026-08-11T21:46:04Z"
assignee: "converge-association-build-record-build-association"
blocked-by: null
closed-reason: null
---

## Context

Surfaced while renaming `insert_all!`'s first parameter to `attributes` in
PR #6370 (`call-args-ar-kwarg-key-set`); its siblings were out of that story's
row set and were left alone rather than swept.

Rails names the first parameter of every bulk-write entry point `attributes`:

- `activerecord/lib/active_record/relation.rb:724` — `def insert_all(attributes, returning: nil, unique_by: nil, record_timestamps: nil)`
- `activerecord/lib/active_record/relation.rb:790` — `def insert_all!(attributes, ...)` (converged in #6370)
- `activerecord/lib/active_record/relation.rb:910` — `def upsert_all(attributes, on_duplicate: :update, update_only: nil, returning: nil, unique_by: nil, record_timestamps: nil)`

`packages/activerecord/src/relation.ts` spells `upsertAll`'s (and the
single-record `insert`/`upsert` wrappers') parameter `records`, so the call into
`InsertAll.execute` reads `(this, records, {...})` where Rails reads
`(self, attributes, ...)`. CLAUDE.md: a parameter keeps the Rails identifier,
camelCased.

## Converged shape

`upsertAll(attributes, ...)`, and the same for any remaining bulk-write wrapper
in `relation.ts` whose Rails counterpart names the parameter `attributes`. Check
`InsertAll`'s own ctor parameter (`inserts`) against
`activerecord/lib/active_record/insert_all.rb:18` (`inserts`) — that one already
matches and must not be swept along.

## Acceptance criteria

1. Every bulk-write parameter in `relation.ts` carries the Rails identifier from
   the `relation.rb` line above it.
2. Any `class: "naming"` rows for `relation.ts` covering these call sites
   disappear from `pnpm parity:api:calls:args:report`; the row count strictly
   decreases.
3. No behaviour change — `insert-all` and `insert-all.trails` suites green.
