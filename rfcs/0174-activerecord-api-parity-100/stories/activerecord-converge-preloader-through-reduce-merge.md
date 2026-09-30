---
title: "activerecord: Preloader::ThroughAssociation's .reduce(:merge) (2 args shape rows)"
status: ready
updated: 2026-09-30
rfc: "0174-activerecord-api-parity-100"
cluster: calls-args
packages: ["activerecord", "ruby-compat"]
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`call-mismatches-exclude/activerecord/associations/preloader/through-association.json` carries two
`reduce` args rows: `source_records_by_owner` and `through_records_by_owner`
(`vendor/rails/v8.0.2/activerecord/lib/active_record/associations/preloader/through_association.rb:89`,93) call `.reduce(:merge)` — Symbol-to-proc,
answering `nil` for an empty collection. JS `Array#reduce` takes a function and throws on an empty array
without an initial value. ruby-compat's `enumerable.ts` has no `inject`/`reduce` yet
(`grep -n reduce packages/ruby-compat/src/enumerable.ts` is empty), so the port inlines a JS reduce with
its own empty-array guard.

## Acceptance criteria

- [ ] ruby-compat gains `Enumerable#inject`/`reduce` (`vendor/ruby/v3.3.11/enum.c` `enum_inject`) with the Symbol-argument arm and `nil` for an empty receiver, with ruby-compat unit tests and a PERMANENT receipt per the package's rule 2.
- [ ] Both call sites call it with `":merge"`; rows deleted, mark tightened.
