---
title: "AbstractAdapter#in_use? is ported as an inUse getter, not isInUse()"
status: draft
updated: 2026-09-23
rfc: "0155-assertion-surfaced-port-bugs"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`AbstractAdapter#in_use?` is `alias :in_use? :owner`
(`vendor/rails/activerecord/lib/active_record/connection_adapters/abstract_adapter.rb:45`).
It returns the owning thread or fiber, or nil. trails ports it as the getter
`get inUse(): Thread | Fiber | null`
(`packages/activerecord/src/connection-adapters/abstract-adapter.ts`). The value is
faithful, but the conventions spelling of `in_use?` is `isInUse()`, and there is no
such method. `parity:api` scores the predicate matched only through the bare
candidate `inUse`, and RFC 0156's predicate-kind report (trails#8002) lists it as a
kind mismatch.

Rails' callers read the predicate: `connection_pool.rb:456` (`disconnect`, `if conn.in_use?`),
`:653` (`flush`), `abstract_adapter.rb:268,304,320`.

## Acceptance criteria

- `AbstractAdapter#isInUse()` exists, returning `this.owner` (the alias target), the way
  `alias :in_use? :owner` defines it.
- Every trails caller of `.inUse` that ports a Rails `in_use?` call site calls `isInUse()`.
- The `inUse` getter is removed unless a Rails reader named `in_use` exists (it does not in
  `abstract_adapter.rb`), so no invented surface remains.
- `abstract_adapter.rb#in_use?` drops out of `predicateKindMismatches` in
  `api-comparison.json`.
