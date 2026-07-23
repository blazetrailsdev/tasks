---
title: "select-manager.test.ts: converge fuzzy-matched chains/distinct_on bodies to Rails assertions"
status: done
updated: 2026-07-23
rfc: "0066-arel-visitor-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: 5176
claim: "2026-07-23T21:07:11Z"
assignee: "select-manager-fuzzy-matched-divergent-chain-quantifier-bodies"
blocked-by: null
closed-reason: null
---

## Context

While converging the create_join klass tests (PR #5102), several neighboring
select-manager.test.ts tests turned out to fuzzy-match Rails names while their
bodies assert the wrong thing:

- `group > chains` (select-manager.test.ts:~630) asserts
  `mgr.where(users.get("id").eq(1))` returns the manager — it exercises
  `where`, not `group`. Rails `select_manager_test.rb:718-722` chains
  `manager.group(...)`.
- `distinct_on > sets the quantifier` (select-manager.test.ts:~960) calls
  `mgr.distinct()` and checks `toSql()` contains `DISTINCT` — it never calls
  `distinctOn`. Rails rb:1195-1204 asserts
  `set_quantifier == Arel::Nodes::DistinctOn.new(table["id"])` and nil after
  `distinct_on(false)`.
- Rails' `distinct > chains` (rb:1187), `distinct_on > chains` (rb:1206),
  `from > chains`, and `where > chains` appeared Rails-only in a raw name diff
  but were absorbed by the fuzzy matcher — audit each and port/converge so the
  bodies exercise the named method.

## Acceptance criteria

- `group > chains` and `distinct_on > sets the quantifier` bodies converged to
  the Rails assertions (chaining the actual method; DistinctOn equality + nil
  clearing).
- The four Rails `chains` tests exist with faithful bodies.
- test:compare select-manager.test.ts delta non-negative (stays 113/113 or
  grows).
