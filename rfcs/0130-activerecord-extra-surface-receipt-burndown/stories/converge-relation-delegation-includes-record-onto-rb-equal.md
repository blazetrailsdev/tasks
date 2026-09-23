---
title: "Converge relation/delegation.ts includesRecord onto rbEqual (Array#include?)"
status: ready
updated: 2026-09-23
rfc: "0130-activerecord-extra-surface-receipt-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: 8
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced by trails#8004. `packages/activerecord/src/relation/delegation.ts`
carries a module-private `includesRecord(records, record)` (identity, then
`equals`), used by the delegated `intersect?`/`&`/`-` arms (`:216`, `:220`) and
by `uniqRecords` (`:531`). It hand-rolls Ruby's `Array#include?` / `Array#uniq`
over a Relation's records, which Rails reaches by delegating to `records`
(`activerecord/lib/active_record/relation/delegation.rb`, `delegate ... :&, :|, :-,
:intersect?, :uniq ... to: :records`). Ruby answers those with `==` / `eql?`, and
`ActiveRecord::Core` aliases `eql?` to `==` (`core.rb:631-637`).

trails#8004 already converged the associations-side twin (`includesRecord` in
`associations/collection-association.ts`) onto `records.some((r) => rbEqual(r, record))`.

## Converged shape

Delete `includesRecord`; compare with `rbEqual` from `@blazetrails/ruby-compat`
at each call site, and write `uniqRecords` as Ruby `Array#uniq` (first
occurrence kept, `eql?` dedup).

## Acceptance criteria

- [ ] `includesRecord` is gone from `relation/delegation.ts`.
- [ ] The delegated set operations and `uniq` compare with `rbEqual`.
- [ ] Existing relation delegation tests stay green.
