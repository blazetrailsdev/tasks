---
title: "assertions-has-many-associations-remainder-2"
status: done
updated: 2026-09-20
rfc: "0132-ar-closure-assertion-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: 4
pr: trails#7902
claim: "2026-09-20T01:37:23Z"
assignee: "assertions-has-many-associations-remainder-2"
blocked-by: null
closed-reason: null
---

## Context

Remainder of `assertions-has-many-associations-remainder` (trails PR for that story converged 26 of 264 mismatches: deleted five placeholder duplicates and re-homed finder/build/create tests into the `with companies fixtures for finders` describe of `packages/activerecord/src/associations/has-many-associations.test.ts`). 238 count/kind mismatches remain against `vendor/rails/activerecord/test/cases/associations/has_many_associations_test.rb`.

Measure: `pnpm parity:test -- --package activerecord --assertions --missing | grep has_many_associations_test`.
Remaining clusters: adding/adding using create/mismatch class, build/new aliased, collection size/empty with dirty target (posts/readers fixtures), counter-cache cluster, clearing/deleting/destroy_all, dependence/restrict, get/set ids, replace, extend option, in-memory replacement, composite key.
Fixture-dependent tests go in a nested `describe` with `fixtures([...])`. Known blocker: `association proxy transaction method starts transaction in association class` (rb:2506).

## Acceptance criteria

- 0 assertion count/kind/value mismatches for the file, or a converged slice plus re-filed remainder. Parked tests use `it.skip` with a `BLOCKED:` line.
