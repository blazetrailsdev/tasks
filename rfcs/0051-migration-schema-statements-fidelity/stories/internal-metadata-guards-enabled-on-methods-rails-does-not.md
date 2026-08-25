---
title: "InternalMetadata guards deleteAllEntries/count/tableExists on enabled? where Rails does not"
status: done
updated: 2026-08-08
rfc: "0051-migration-schema-statements-fidelity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: 6256
claim: "2026-08-08T18:16:03Z"
assignee: "pg-adapter-test-aftereach-connect-hook-timeout"
blocked-by: null
closed-reason: null
---

## Context

Seen while converging the statement calls in PR #6249.

Rails guards exactly five `InternalMetadata` methods on `enabled?`
(`internal_metadata.rb`): `[]=` (:38), `[]` (:48), `delete_all_entries` has
NO guard (:57-62), `count` has NO guard (:64-71),
`create_table_and_set_flags` (:74), `create_table` (:85), `drop_table` (:100),
and `table_exists?` has NO guard (:108-110).

trails adds an `if (!this.enabled) return ...` early return to
`deleteAllEntries`, `count`, `get`, and `tableExists`
(`packages/activerecord/src/internal-metadata.ts`), each with a prose comment
arguing the guard is "symmetric" with the guarded methods. Three of those four
are guards Rails does not have, and they change observable answers: a disabled
instance reports `count() === 0` and `tableExists() === false` even when the
physical `ar_internal_metadata` table exists and has rows, where Rails would
answer the truth.

The guards were plausible when trails built `InternalMetadata` over bare
NullPool-backed adapters, but `enabled` now reads a real `dbConfig` on the
pool arm.

## Converged shape

Drop the `enabled` early returns from `deleteAllEntries`, `count`, and
`tableExists`, leaving only the five Rails guards. `get` corresponds to Rails'
`[]` (:48), which IS guarded — keep that one.

Check the call sites first: `DatabaseTasks` and the trailties `db` commands may
be leaning on the invented guards to mean "no metadata store", where Rails
routes through `NullInternalMetadata` instead.

Blocked-on note: this likely wants
`internal-metadata-takes-a-pool-nullpool-arm-reads-enabled` (RFC 0051, ready)
to land first, since that story settles what `enabled` answers on the NullPool
arm.

## Acceptance criteria

- [ ] `deleteAllEntries` / `count` / `tableExists` carry no `enabled` guard
      (`internal_metadata.rb:57-71`, `:108-110`).
- [ ] `get` keeps its guard, matching `[]` (`internal_metadata.rb:47-54`).
- [ ] The prose comments justifying the removed guards go with them.
- [ ] Call sites that relied on the guard route through `NullInternalMetadata`
      instead, as Rails does.
