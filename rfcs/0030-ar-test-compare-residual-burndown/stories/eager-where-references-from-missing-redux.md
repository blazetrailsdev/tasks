---
title: "eager-where-references-from-missing-redux"
status: ready
updated: 2026-07-22
rfc: "0030-ar-test-compare-residual-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Story `a1-eager-where-references-and-from` (RFC 0030) is marked done, but the
fresh `test:compare` run (2026-07-22) still reports 4 missing tests in
`associations/eager.test.ts`:

- type cast in where references association name
  (vendor/rails/activerecord/test/cases/associations/eager_test.rb:230)
- attribute alias in where references association name (:240)
- calculate with string in from and eager loading (:246)
- with two tables in from without getting double quoted (:250)

Either the predecessor PR shipped a subset or these were dropped in review.
trails file: `packages/activerecord/src/associations/eager.test.ts` (tests
absent). Port faithfully with canonical models/fixtures; do not rename.

## Acceptance criteria

- [ ] The 4 tests ported (names verbatim) and matched in `test:compare` (or
      it.skip with BLOCKED/ROOT-CAUSE tags if a real impl gap remains, filed as
      its own story).
- [ ] eager.test.ts missing count drops to 0; no new gate-mismatches.
