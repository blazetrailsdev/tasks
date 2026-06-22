---
title: "MemoryStore increment seeds via Integer(amount) raise semantics, not Math.trunc"
status: ready
updated: 2026-06-22
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 30
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Surfaced in review of #3853 (memory-store-increment-deletematched-rails-fidelity).
`MemoryStore#modifyValue` uses `Math.trunc(amount)` on the miss/expired/mismatched
seed path (`packages/activesupport/src/cache/memory-store.ts:129`), where Rails
`memory_store.rb:248` calls `Integer(amount)`. Ruby `Integer(1.5)` and
`Integer("x")` **raise ArgumentError**; the trails port silently truncates floats
and would coerce rather than raise. Amount is always an integer through
increment/decrement in normal use, so this is an edge-only deviation — but to
mirror Rails exactly the seed path should reject non-integer `amount` the way
`Integer()` does.

## Acceptance criteria

- `MemoryStore` increment/decrement seed path mirrors Ruby `Integer(amount)`:
  raise (ArgumentError-equivalent) on a non-integer/float-with-fraction or
  non-numeric `amount` rather than silently truncating.
- Add a test asserting the raise on a fractional/non-integer amount.
- api:compare / test:compare delta non-negative.
