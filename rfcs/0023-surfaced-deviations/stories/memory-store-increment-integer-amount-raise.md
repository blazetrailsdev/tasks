---
title: "MemoryStore increment seeds via Integer(amount) raise semantics, not Math.trunc"
status: claimed
updated: 2026-07-04
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 30
priority: null
pr: null
claim: "2026-07-04T17:34:28Z"
assignee: "memory-store-increment-integer-amount-raise"
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

**Folds in `memory-store-increment-amount-integer-coercion` (closed 2026-06-25):**
Rails coerces `amount = Integer(amount)` **once** at the top of `modify_value`
(`memory_store.rb:241-258`) and uses that integer uniformly for the seed `write`,
the return value, and the hit-path addition. trails currently writes
`Math.trunc(amount)` on the seed path but **returns the raw un-truncated amount**
and adds the raw amount on the hit path (`toI(entry.value) + amount`), so a
fractional amount diverges three ways. Coercing once (with `Integer()` raise
semantics, not `Math.trunc`) and threading that value everywhere fixes both the
raise gap and the return/hit-path inconsistency in one change.

## Acceptance criteria

- `MemoryStore` increment/decrement seed path mirrors Ruby `Integer(amount)`:
  raise (ArgumentError-equivalent) on a non-integer/float-with-fraction or
  non-numeric `amount` rather than silently truncating.
- Coerce `amount` **once** and use the coerced integer uniformly for the seed
  write, the return value, and the hit-path addition (no raw-amount leakage).
- Add tests asserting (a) the raise on a fractional/non-integer amount and
  (b) the return value equals the coerced integer on both seed and hit paths.
- api:compare / test:compare delta non-negative.
