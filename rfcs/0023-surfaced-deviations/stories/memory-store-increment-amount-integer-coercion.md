---
title: "MemoryStore.modifyValue coerce amount once like Rails Integer(amount)"
status: done
updated: 2026-06-25
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 20
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

> **CLOSED 2026-06-25 — merged.** Folded into `memory-store-increment-integer-amount-raise`, which now covers coercing `amount` once and threading the coerced integer through the seed write, return value, and hit path (the two stories disagreed on trunc-vs-raise; the keeper uses the correct Ruby `Integer()` raise semantics).

## Context

`MemoryStore.modifyValue` (`packages/activesupport/src/cache/memory-store.ts`)
diverges from Rails on the seed path for a fractional `amount`. Rails coerces
`amount = Integer(amount)` once at the top of `modify_value`
(`memory_store.rb:241-258`, mirroring `file_store.rb:226`) and uses that integer
uniformly for the seed `write`, the return value, and the hit-path addition.

trails MemoryStore currently does `this.write(name, Math.trunc(amount), options)`
on the seed path but **returns the raw, un-truncated `amount`**, and the hit path
adds the raw `amount` (`toI(entry.value) + amount`). For integer amounts (the
norm) this is identical, but a fractional amount diverges three ways: the seed
write stores `trunc` yet returns the fraction, and the hit path returns a
fractional sum where Rails returns `to_i + Integer(amount)`.

FileStore was converged in PR #3851 (cache-increment-decrement-seed-on-miss-
converge) via `const amt = Math.trunc(amount)` used uniformly. This story brings
the already-merged MemoryStore sibling to the same Rails-faithful shape.

## Acceptance criteria

- `MemoryStore.modifyValue` coerces `amount` once (`Math.trunc`) and uses that
  value for the seed write, the return value, and the hit-path addition,
  matching Rails `Integer(amount)` and the FileStore sibling.
- A test asserting fractional-amount behavior (e.g. `increment("k", 1.9)` on a
  miss returns `1` and stores `1`) where it adds parity value; otherwise no test
  regression.
- api:compare / test:compare delta non-negative.
