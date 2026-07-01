---
title: "redo-eager-singularization-faithful-port"
status: ready
updated: 2026-06-30
rfc: "0048-one-schema-no-drop-tests"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: 1
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Faithful-port follow-up split out from `redo-associations-faithful-port` (RFC
0048). That story's PR ported only `inner-join-association.test.ts`; this story
covers the remaining sibling file. Per the RFC 0048 Convergence contract (binding):
port the Rails test file word-for-word onto canonical `TEST_SCHEMA` + official
models + real fixtures — do NOT rename the existing trails suite.

- `packages/activerecord/src/associations/eager-singularization.test.ts`
  → mirror `vendor/rails/activerecord/test/cases/associations/eager_singularization_test.rb`

## Acceptance criteria

- [ ] File mirrors Rails source word-for-word (names, setup, fixtures, assertions);
      never invent/reword test names.
- [ ] Canonical `TEST_SCHEMA` + official models + real fixtures only; no bespoke
      tables/columns, no `_tableName` hacks.
- [ ] Impl gaps → fix impl or file `0023-surfaced-deviations` + skip
      tracked-pending-convergence; don't bend tests.
- [ ] Single PR from main, ≤500 LOC.

## RFC 0048 working notes (added 2026-07-01)

Two conventions apply when (re)writing tests under this RFC:

- **Use the fixtures helper; do not hand-call `registerModel`.** The
  Rails-faithful `fixtures()` / `setupFixtures()` surface is merged (#4345; the
  old `useHandlerFixtures` / `setupHandlerSuite` call sites were renamed to
  `fixtures` / `setupFixtures` in #4346). Declaring a fixture set now
  **auto-registers its model on resolution** (#4348,
  `fixtures-register-model-on-resolution`) — mirroring Rails `fixtures :authors`.
  So declare the fixture set and let resolution register the model; do **not**
  add manual `registerModel(...)` lines for a fixture-backed model. (Association
  targets that have no fixture set of their own may still need an explicit
  register until the autoload fallback lands.)
- **`*.trails.test.ts` holds trails-only cases.** The `<name>.test.ts` file is a
  faithful word-for-word mirror of its Rails source. Any test case with **no
  Rails counterpart** (a trails-specific extension) belongs in a sibling
  `<name>.trails.test.ts` file — keep it out of the Rails-mirrored `.test.ts` so
  `test:compare` maps cleanly.
