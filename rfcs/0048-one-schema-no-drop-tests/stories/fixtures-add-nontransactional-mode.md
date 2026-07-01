---
title: "Add non-transactional fixtures() mode; converge view.test.ts + signed-id.test.ts"
status: in-progress
updated: 2026-07-01
rfc: "0048-one-schema-no-drop-tests"
cluster: null
deps: []
deps-rfc: []
est-loc: 250
priority: 0
pr: 4381
claim: "2026-07-01T18:54:56Z"
assignee: "fixtures-add-nontransactional-mode"
blocked-by: null
---

## Context

Split from `fixtures-converge-or-ratify-remaining-direct-adapter-callers`
(RFC 0048). Two suites still call the lower-level direct-adapter `useFixtures`
because `fixtures()` has no non-transactional mode — Rails sets
`self.use_transactional_tests = false` on both, so DML must commit (no savepoint
pin) and be visible across pooled connections:

- `packages/activerecord/src/view.test.ts:150-151` (ViewWithoutPrimaryKeyTest)
  and `:227-228` (UpdateableViewTest) — `setupFixtures()` +
  `useFixtures(["books","authors"], () => Base.connection, {...})`. Rationale at
  `view.test.ts:221-226`: DML through views must commit, savepoint-wrapped path
  breaks them.
- `packages/activerecord/src/signed-id.test.ts:27,40` — `setupFixtures()` +
  `useFixtures(["accounts","companies","toys"], () => Base.connection)` with NO
  transactional wrapper (per-test delete/reseed).

The escape-hatch `useFixtures` overload is documented at
`packages/activerecord/src/test-helpers/use-fixtures.ts:306-318`. `fixtures()`
lives at `packages/activerecord/src/test-helpers/fixtures.ts:40-62`; its options
type is `WithTransactionalFixturesOptions & UseFixturesOpts`.

## Acceptance criteria

- [ ] Add a Rails-faithful NON-transactional mode to the `fixtures()` surface
      (mirrors `use_transactional_tests = false`: per-test delete/reseed, no
      savepoint pin), selectable via an option on the existing `fixtures()`
      signature.
- [ ] Converge `view.test.ts` (both view classes) and `signed-id.test.ts` off
      the direct-adapter `useFixtures` path onto `fixtures()` in the new mode.
- [ ] No test names change; `test:compare` non-negative.
- [ ] Does NOT delete the direct-adapter overload (still needed by the multi-DB
      / own-adapter callers — see sibling story). Leave
      `fixtures-delete-direct-adapter-overload` to remove it once all callers
      are gone.
