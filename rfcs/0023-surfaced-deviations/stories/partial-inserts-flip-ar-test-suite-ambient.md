---
title: "Flip AR test-suite ambient to partial_inserts=true (Rails helper.rb)"
status: ready
updated: 2026-06-20
rfc: "0023-surfaced-deviations"
cluster: null
deps:
  [
    "partial-inserts-composite-pk-key-retention",
    "partial-inserts-optimistic-locking-initial-value",
    "partial-inserts-test-schema-db-default-fidelity",
  ]
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Convergence target for RFC 0023 ar-test-suite-partial-inserts-ambient-divergence.
Rails' AR test suite (activerecord/test/cases/helper.rb) runs with the gem
framework default `partial_inserts = true`; the trails harness flips it to
false via `loadDefaults("7.0")` in
`packages/activerecord/src/test-setup-ar.ts` (modelling a 7.0 app, RFC 0020).

The audit (the parent story's PR) codified a per-model opt-in
(`restoreRailsTestPartialInserts`, test-helpers/rails-test-partial-inserts.ts)
as the sanctioned interim pattern, and found that a blanket flip of the harness
ambient to `true` is blocked on these systemic gaps:

- composite-PK key retention under partial inserts
- optimistic-locking initial-value under partial inserts
- test-schema DB-default fidelity (model default vs DB column default)

Once those land, flip the harness to the Rails-test ambient (`partial_inserts =
true` — i.e. drop the partial_inserts effect of `loadDefaults("7.0")` for the
test suite), remove the now-redundant `restoreRailsTestPartialInserts` opt-ins,
and confirm test:compare / api:compare delta is non-negative.

## Acceptance criteria

- [ ] Blocking gaps closed (composite-PK, optimistic-locking, test-schema
      DB-default fidelity stories).
- [ ] AR test suite runs with `partial_inserts = true` (Rails-test ambient).
- [ ] `restoreRailsTestPartialInserts` opt-ins removed; helper retired or
      repurposed.
- [ ] test:compare / api:compare delta non-negative.
