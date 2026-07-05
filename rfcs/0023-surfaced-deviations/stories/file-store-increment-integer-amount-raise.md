---
title: "FileStore increment coerces amount via Integer() raise semantics, not Math.trunc"
status: in-progress
updated: 2026-07-05
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 30
priority: null
pr: 4582
claim: "2026-07-05T00:47:09Z"
assignee: "file-store-increment-integer-amount-raise"
blocked-by: null
closed-reason: null
---

## Context

Surfaced while fixing `memory-store-increment-integer-amount-raise` (PR #4560).
`FileStore#modifyValue` (`packages/activesupport/src/cache/stores/file-store.ts:242`)
coerces `amount` via `Math.trunc(amount)`, where Rails `file_store.rb:226` calls
`amount = Integer(amount)`. Ruby `Integer(Float::NAN)` / `Integer(Float::INFINITY)`
raise FloatDomainError; the trails port silently truncates (NaN → NaN, Infinity →
Infinity) instead of raising. Unlike MemoryStore, Rails FileStore genuinely
coerces once and threads `amount` through the seed write, the return value, and
the hit-path addition — so the trails structure is already correct; only the
`Math.trunc` → `Integer()` raise semantics diverge.

An `integer()` helper mirroring Ruby `Integer()` (finite → truncate toward zero,
NaN/Infinity → throw ArgumentError) already exists in
`packages/activesupport/src/cache/memory-store.ts` from PR #4560; consider
extracting it to a shared module and reusing it here.

## Acceptance criteria

- `FileStore#modifyValue` coerces `amount` with `Integer()` raise semantics
  (raise on NaN/Infinity) rather than `Math.trunc`.
- Coerce once, thread through seed write / return value / hit-path addition
  (matches Rails file_store.rb:222-240).
- Tests assert the raise on NaN/Infinity and that finite floats truncate.
- api:compare / test:compare delta non-negative.
