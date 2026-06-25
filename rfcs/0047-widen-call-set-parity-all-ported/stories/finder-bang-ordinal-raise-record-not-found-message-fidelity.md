---
title: "finder-bang-ordinal-raise-record-not-found-message-fidelity"
status: claimed
updated: 2026-06-25
rfc: "0047-widen-call-set-parity-all-ported"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: "2026-06-25T04:02:34Z"
assignee: "finder-bang-ordinal-raise-record-not-found-message-fidelity"
blocked-by: null
---

## Context

Rails' bang ordinal/take finders all route their not-found failure through the
shared builder with no args, yielding `Couldn't find #{name}`:
`first!`/`last!` (`finder_methods.rb:183,213`) are literally
`first || raise_record_not_found_exception!`, and `second!`…`forty_two!`,
`second_to_last!`/`third_to_last!`, and `take!` follow the same
`<finder> || raise_record_not_found_exception!` shape.

trails diverges: `performFirstBang`/`performLastBang`/`performTakeBang` and the
ordinal `*Bang` methods (`relation/finder-methods.ts` — `performFirstBang` at
~362, `performLastBang` ~410, plus `secondBang`/`thirdBang`/`fourthBang`/
`fifthBang`/`fortyTwoBang`/`secondToLastBang`/`thirdToLastBang` and `takeBang`)
throw `RecordNotFound` inline with the message `"${name} not found"` and do NOT
route through `raiseRecordNotFoundExceptionBang`. Two divergences: (1) wrong
message text (`X not found` vs `Couldn't find X`), (2) bypass of the builder so
the wide call-set parity flag fires `raise_record_not_found_exception!` on these
bang finders.

Sibling of finder-raise-record-not-found-message-fidelity (PR #4098), which
converged `find_one`/`find_some`/`find_some_ordered`; the ordinal/take bang
finders were explicitly out of that story's scope.

## Acceptance criteria

- Each bang ordinal/take finder raises via
  `raiseRecordNotFoundExceptionBang()` (no args → `Couldn't find ${name}`),
  matching Rails' `<finder> || raise_record_not_found_exception!`.
- Tests asserting the exact `Couldn't find ${name}` message, named to match the
  corresponding Rails finder tests (read them first).
- The wide call-mismatches artifact no longer flags
  `raise_record_not_found_exception!` for the bang-finder pairs; remove the
  now-stale wide-baseline entries.
- File scope stays within `relation/finder-methods.ts` (+ tests). Watch for
  existing tests asserting the old `"${name} not found"` text — converge them to
  the Rails message, do not rename.
