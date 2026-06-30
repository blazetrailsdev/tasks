---
title: "converge-nested-attributes-test-one-schema"
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

Split out from `converge-persistence-validations-one-schema` (PR deleting the
bespoke top-level `validations.test.ts` + `autosave.test.ts`). `nested-attributes.test.ts`
is a separate file under the 500-LOC ceiling and converts all-or-nothing, so it
gets its own story per CLAUDE.md no-fan-out rule.

`packages/activerecord/src/nested-attributes.test.ts` (2393 LOC) imports canonical
models + fixtures but its header still reads "Tests to increase Rails test coverage
matching" and it declares ad-hoc tables. Faithful-audit it against
`vendor/rails/activerecord/test/cases/nested_attributes_test.rb` (1237 LOC):
mirror the Rails class describe names, confirm every Rails test case is present
under its exact name, drop trails-invented `it(...)` with no Rails counterpart,
and eliminate ad-hoc tables in favor of canonical `TEST_SCHEMA`. Also confirm
the companion `nested_attributes_with_callbacks_test.rb` is covered by
`nested-attributes-with-callbacks.test.ts` (may be a separate sub-task).

## Acceptance criteria

- [ ] Every `it(...)` maps 1:1 to a Rails `def test_*` in nested_attributes_test.rb;
      no trails-invented test names.
- [ ] Every Rails `def test_*` has a faithful port; Rails class names mirrored as
      `describe(...)`.
- [ ] Canonical schema/models/fixtures only; no ad-hoc tables, no `_tableName`
      hack, no invented columns. Add to `TEST_SCHEMA` if schema.rb has it.
- [ ] Surfaced impl gaps fixed to match Rails or filed under 0023-surfaced-deviations
      and marked tracked-pending-convergence.
