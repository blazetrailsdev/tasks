---
title: "assertions-has-many-through-associations-file"
status: draft
updated: 2026-09-18
rfc: "0132-ar-closure-assertion-parity"
cluster: null
packages: []
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

Remainder of `assertions-has-many-through-cluster`, split off so the disable-joins file could ship alone.
`vendor/rails/activerecord/test/cases/associations/has_many_through_associations_test.rb` still reports 35 assertion-count and 79
assertion-kind divergences (measured 2026-09-18 with
`pnpm parity:test -- --package activerecord --assertions --missing`). trails counterpart:
`packages/activerecord/src/associations/has-many-through-associations.test.ts`.

Follow the shape of the disable-joins PR: converge each test to Rails' assertions, park any that
fail on a production bug as `it.skip` with the structured annotation and a story in
0155-assertion-surfaced-port-bugs.

## Acceptance criteria

- has_many_through_associations_test.rb reports 0 assertion-count, 0 assertion-kind and 0 assertion-value mismatches.
- Mark file untouched (frozen); no test renames.
