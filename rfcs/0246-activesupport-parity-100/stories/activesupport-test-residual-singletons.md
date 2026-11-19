---
title: "activesupport: port notifications, enumerable and HWIA test singletons"
status: in-progress
updated: 2026-11-19
rfc: "0246-activesupport-parity-100"
cluster: test-residuals
packages: [activesupport]
deps: []
deps-rfc: []
est-loc: 200
priority: null
pr: trails#10360
claim: "2026-11-19T15:01:33Z"
assignee: "activesupport-inflector-test-loop-residue"
blocked-by: null
closed-reason: null
---

## Context

These are the leftover test misses that no other RFC 0246 story or dep owns:

- `notifications_test.rb` (4): instrumenter exposes its id, nested events
  can be instrumented, instrument publishes when exception is raised, event
  is pushed even without block.
- `core_ext/enumerable_test.rb` (3): minimum, maximum, in order of ignores
  missing series.
- `hash_with_indifferent_access_test.rb` (2): symbolize keys for HWIA, lookup
  returns the same object that is stored.

## Acceptance criteria

- [ ] Port all 9 tests. Fix failures in lib.
- [ ] Each of the three files reaches 0 Miss.
