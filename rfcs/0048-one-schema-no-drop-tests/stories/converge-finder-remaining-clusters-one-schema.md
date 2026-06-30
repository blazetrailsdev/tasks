---
title: "converge-finder-remaining-clusters-one-schema"
status: ready
updated: 2026-06-30
rfc: "0048-one-schema-no-drop-tests"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Follow-up to `converge-finder-one-schema` (RFC 0048). That PR converged only the
opening ordinal-finder cluster of `packages/activerecord/src/finder.test.ts`
(take/sole/first/second/third + bang/offset/have-primary-key-order variants) to
canonical Topic + topics fixtures. The file is 1933 Rails lines / ~150 tests and
exceeds the 500-LOC ceiling as a single port, so the rest stays bespoke
(`class Topic extends Base { attribute(...) }` + bespoke `TEST_SCHEMA` via
`defineSchema`) pending convergence.

Remaining bespoke clusters to converge to faithful ports of
`vendor/rails/activerecord/test/cases/finder_test.rb`, riding canonical
`TEST_SCHEMA` + `test-helpers/models/*` + real fixtures:

- fourth / fifth / second_to_last / third_to_last / last (+ bang/offset/order)
- take/first/last(n) integer + SQL-limit query-assertion tests
  (`nth_to_last_with_order_uses_limit`, `last_with_integer_*`,
  `last_on_loaded_relation_should_not_use_sql`, `last_with_irreversible_order`)
- exists cluster (`test_exists*`)
- find / find_with_ids cluster (finder_test.rb:39-188)
- find*by*\* cluster
- find_on_hash_conditions / condition-interpolation cluster

Split across PRs under the 500-LOC ceiling (one cluster or sub-cluster per PR).

## Acceptance criteria

- [ ] Each cluster mirrors `finder_test.rb` word-for-word: same test names,
      fixtures, assertions; canonical schema/models/fixtures only — no bespoke
      tables, invented columns, or inline `class Topic extends Base`.
- [ ] Delete the bespoke `defineSchema(TEST_SCHEMA)` blocks as clusters convert;
      the file ends fully canonical with `useHandlerFixtures`.
- [ ] Surfaced impl gaps → fix the impl or `it.skip` under
      `0023-surfaced-deviations`; record the un-skip.
- [ ] Confirm against Rails source, not prior trails behavior.
