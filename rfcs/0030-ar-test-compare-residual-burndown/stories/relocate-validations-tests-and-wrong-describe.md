---
title: "relocate-validations-tests-and-wrong-describe"
status: ready
updated: 2026-07-22
rfc: "0030-ar-test-compare-residual-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: 1
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`test:compare` (fresh run 2026-07-22, activerecord 98.1%) reports **21 misplaced
tests + 6 wrong-describe** — the largest single mechanical parity gap:

- All 21 tests of Rails `validations_test.rb` live in
  `packages/activerecord/src/validations/validations.test.ts` but convention maps
  the file to `packages/activerecord/src/validations.test.ts` (which does not
  exist). Move the file (git mv), keeping every test name verbatim.
- Wrong-describe (right file, wrong nested describe):
  - `associations/has-many-through-associations.test.ts` — 4 tests nested under
    trails-invented describes `composite pk through associations (canonical)` /
    `through scope (canonical)`; Rails has them directly under
    `HasManyThroughAssociationsTest`
    (vendor/rails/activerecord/test/cases/associations/has_many_through_associations_test.rb).
  - `adapters/postgresql/postgresql-adapter.test.ts` — "serial sequence" and
    "default sequence name" nested under an extra `serial_sequence` describe;
    Rails `postgresql_adapter_test.rb` has them flat under
    `PostgreSQLAdapterTest`.

Surfaced by test-comparison report sections MISPLACED TESTS / WRONG DESCRIBE
(convention-comparison.json, package activerecord).

## Acceptance criteria

- [ ] `validations/validations.test.ts` relocated to `validations.test.ts`; the
      21 tests report matched (misplaced count for activerecord drops by 21).
- [ ] The 6 wrong-describe tests re-nested to match Rails' describe structure;
      wrong-describe count drops to 0. Test names unchanged.
- [ ] Parity percent rises accordingly; no new gate-mismatches.
