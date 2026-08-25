---
title: "Finder methods route through raiseRecordNotFoundExceptionBang for faithful messages"
status: done
updated: 2026-06-25
rfc: "0047-widen-call-set-parity-all-ported"
cluster: real-omission
deps:
  - wide-call-set-significant-knob-and-baseline
deps-rfc: []
est-loc: 150
priority: null
pr: 4098
claim: "2026-06-25T03:02:34Z"
assignee: "finder-raise-record-not-found-message-fidelity"
blocked-by: null
---

## Context

Rails routes all finder not-found failures through one builder,
`raise_record_not_found_exception!`
(`vendor/rails/activerecord/lib/active_record/relation/finder_methods.rb:417`),
called from `find_one`-equivalent (line 536: `raise_record_not_found_exception!(id, 0, 1)`)
and the `find_some` paths (lines 563, 578:
`raise_record_not_found_exception!(ids, result.size, expected_size)`). The
builder composes the faithful messages — e.g. `Couldn't find X with 'id'=Y` and
`Couldn't find all Xs with 'id': (a, b) (found N results, but was looking for
M)`.

trails ports the builder as `raiseRecordNotFoundExceptionBang`
(`packages/activerecord/src/relation/finder-methods.ts:578`), but
`findOne` (finder-methods.ts:710), `findSome` (722), and `findSomeOrdered`
(756) **bypass it** and `throw new RecordNotFound(...)` inline with simplified
messages (`Couldn't find ${modelName}`, `Couldn't find all ${modelName}`) that
omit the id/key and the "found N results, but was looking for M" detail. The
wide call-set flag fires `raise_record_not_found_exception!` on `find_one`,
`find_some`, `find_some_ordered`.

## Acceptance criteria

- `findOne` / `findSome` / `findSomeOrdered` raise through
  `raiseRecordNotFoundExceptionBang` (or otherwise produce byte-faithful
  messages), passing the same `ids` / `result_size` / `expected_size` / `key`
  arguments Rails passes, so the resulting `RecordNotFound` message, `model`,
  `primary_key`, and `id` fields match Rails.
- Tests asserting the exact message text for the single-id and
  multi-id-partial-result cases, named to match the Rails finder tests
  (read them first).
- The wide call-mismatches artifact no longer flags
  `raise_record_not_found_exception!` for these three pairs.
- File scope stays within `relation/finder-methods.ts` (+ tests).

## Out of scope

- The `first!` / `last!` / `second!` … ordinal finders (lines 184-326) unless
  they share the same inline-throw gap — confirm and fold in only if so.
