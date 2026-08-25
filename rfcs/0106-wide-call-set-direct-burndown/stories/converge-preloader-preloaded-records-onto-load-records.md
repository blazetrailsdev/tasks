---
title: "Converge Preloader::Association#preloaded_records onto load_records"
status: done
updated: 2026-08-20
rfc: "0106-wide-call-set-direct-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 160
priority: null
pr: 6771
claim: "2026-08-20T13:52:33Z"
assignee: "converge-preloader-preloaded-records-onto-load-records"
blocked-by: null
closed-reason: null
---

## Context

Surfaced while landing `wave-4d-associations-residue-part-5` (PR #6763). That
PR converged `Preloader::Association#load_records -> records_for` but left

    associations/preloader/association.ts  preloaded_records  load_records

on a per-site reason.

Rails (`activerecord/lib/active_record/associations/preloader/association.rb:148-158`):

    def records_by_owner
      load_records unless defined?(@records_by_owner)
      @records_by_owner
    end

    def preloaded_records
      load_records unless defined?(@preloaded_records)
      @preloaded_records
    end

Both readers force the preload query on first access. trails ports
`recordsByOwner` as `async recordsByOwner()` and it _does_ make the call
(`packages/activerecord/src/associations/preloader/association.ts:88-93`), but
`preloadedRecords` is a synchronous getter returning `this._preloadedRecords ?? []`
(`:95-97`) and so cannot await `loadRecords`. Callers rely on `load()` having
awaited it first, which makes the forcing behaviour implicit rather than the
reader's own contract — a preloader used out of that order silently reads `[]`
where Rails would run the query.

Note the two readers are asymmetric in trails today for no Rails reason: same
Ruby shape, one ported async and one sync.

## Converged shape

`preloadedRecords` becomes `async preloadedRecords()` alongside
`recordsByOwner()`, forcing `await this.loadRecords()` when
`this._preloadedRecords === undefined`, exactly as `recordsByOwner` already
does. Every reader is updated to await it.

Ruby's `defined?(@preloaded_records)` is an _assignment_ check, not a truthiness
check — the TS guard must be `=== undefined` on the backing field, never `?? []`,
so a legitimately-empty preload does not re-run the query.

## Acceptance criteria

- [ ] `preloadedRecords` makes the `loadRecords` call Rails makes, guarded on
      the backing field being unassigned.
- [ ] Call sites updated; no reader silently observes `[]` for an unloaded
      preloader.
- [ ] The baseline row above is deleted by hand via `serializeBaseline` and its
      mark shard tightened. No `--write`, no reseed.
- [ ] `pnpm parity:api:calls` / `:args` green; SQLite, PostgreSQL and
      MySQL/MariaDB lanes green.
