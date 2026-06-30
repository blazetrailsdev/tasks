---
title: "redo-has-one-through-faithful-port"
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

Faithful-port follow-up split out from `redo-associations-faithful-port` (RFC
0048). That story's PR ported only `inner-join-association.test.ts`; this story
covers the has_one_through sibling file (~1639 LOC trails / ~478 LOC Rails —
needs its own PR). Per the RFC 0048 Convergence contract (binding): port the
Rails test file word-for-word onto canonical `TEST_SCHEMA` + official models +
real fixtures — do NOT rename the existing trails suite.

- `packages/activerecord/src/associations/has-one-through-associations.test.ts`
  → mirror `vendor/rails/activerecord/test/cases/associations/has_one_through_associations_test.rb`

## Acceptance criteria

- [ ] File mirrors Rails source word-for-word (names, setup, fixtures, assertions);
      never invent/reword test names.
- [ ] Canonical `TEST_SCHEMA` + official models + real fixtures only; no bespoke
      tables/columns, no `_tableName` hacks.
- [ ] Impl gaps → fix impl or file `0023-surfaced-deviations` + skip
      tracked-pending-convergence; don't bend tests.
- [ ] Single PR from main, ≤500 LOC. If the faithful port exceeds the ceiling,
      ship a coherent subset and register the remainder as another story.
