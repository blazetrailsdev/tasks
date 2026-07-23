---
title: "has-many-assertion-value-restoration"
status: ready
updated: 2026-07-23
rfc: "0030-ar-test-compare-residual-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: 3
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`test:compare --package activerecord --assertions` reports 16 assertion-VALUE
mismatches in `associations/has-many-associations.test.ts` vs
`vendor/rails/activerecord/test/cases/associations/has_many_associations_test.rb`.
These are not matcher-mapping noise — the TS tests assert different values or
weaker booleans than Rails. Representative entries from the report:

- "counting with counter sql": Rails 3, trails 2.
- "counting with column name and hash": Rails 3, trails 1.
- "create many": Rails 4, trails 2.
- "finding default orders"/"finding with different class name and order":
  Rails asserts names ("Summit"/"Apex"); trails asserts counts (2).
- "passes custom context validation to validate children": Rails asserts the
  error message "can't be blank"; trails asserts `true`.
- "association size calculation works with default scoped selects when not
  previously fetched": Rails 5, trails 2.
- "update all respects association scope": Rails asserts affected-row count 1;
  trails asserts a boolean.
- Also: "default scope on relations is not cached", "find scoped grouped
  having", "collection size after building", "build many via block", "create
  without loading association", "replace with new", "attributes are set when
  initialized from has many null relationship", "build and create ... default
  scope" family (also assertion-count drops, e.g. 12→1).

Each divergent value usually means trails seeded different fixture data or
weakened the assertion during porting. Read the Rails test, restore the exact
expected values (and any missing assertions in the same tests).

## Acceptance criteria

- Each listed test asserts the same values as Rails (per canonical fixtures);
  where trails fixtures legitimately differ, converge the fixtures instead.
- `test:compare --assertions` shows 0 value-mismatches for
  has_many_associations_test.rb.
