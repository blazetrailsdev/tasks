---
title: "fixtures-parity-per-test-enforcement-for-fixtures"
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

`fixtures()` (the unified Rails-faithful surface, test-helpers/fixtures.ts) is
currently registered in `TRANSACTIONAL_HELPERS` in
`eslint/test-fixture-parity.mjs:195`, not `ACCESSOR_HELPERS`. This is correct
for fidelity today: `fixtures()` always wraps the transactional handler path
and is the unified replacement for the old
`useHandlerTransactionalFixtures()` + `useFixtures(...)` pairing, so the
class-level fallback (whole-scope exempt) matches Rails' class-level
`fixtures :name`.

The downside flagged in review (PR #4347): under `TRANSACTIONAL_HELPERS`, the
_per-test_ accessor-usage check is skipped for the entire scope. A test that
destructures `const { topics } = fixtures([...])` but whose body never calls
`topics(...)` — when its Rails counterpart DOES name that fixture — passes
silently. Moving `fixtures` to `ACCESSOR_HELPERS` would restore per-test
enforcement BUT produces false positives on Rails-faithful tests that legitimately
name no fixture while sharing a describe scope that destructures accessors —
proven at PR #4347 HEAD: exactly `eager_test.rb:202`
(`Author.includes(:post)`) and `eager_test.rb:1398` (records built inline via
`create!`) flag, and neither can be made to pass faithfully.

This concern compounds as `fixtures-rename-handler-callsites` converts
`useHandlerFixtures` (today in `ACCESSOR_HELPERS`) → `fixtures()`.

## Acceptance criteria

- [ ] `fixtures()` gets per-test accessor enforcement (the `ACCESSOR_HELPERS`
      semantics) WITHOUT false-positiving on Rails-faithful zero-named-fixture
      tests. Likely needs the rule to distinguish "test whose Rails counterpart
      names a fixture" from "Rails counterpart loads fixtures but names none" —
      e.g. a per-test (desc-level) allowlist in the mapping, or marking the two
      classes differently in `scripts/generate-fixture-parity-map.ts`.
- [ ] `eager_test.rb:202` and `eager_test.rb:1398` (and equivalents) stay green
      without whole-file excluding `associations/eager.test.ts`.
- [ ] Rule test cases cover: destructured-but-unused accessor → warns;
      Rails-faithful zero-named-fixture test in an accessor-destructuring scope →
      passes.
- [ ] No test names change; test:compare non-negative.

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
