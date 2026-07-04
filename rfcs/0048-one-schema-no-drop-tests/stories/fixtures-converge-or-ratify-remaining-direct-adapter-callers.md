---
title: "Converge or ratify the 4 remaining direct-adapter useFixtures call sites (non-transactional / multi-DB / own-adapter)"
status: closed
updated: 2026-07-04
rfc: "0048-one-schema-no-drop-tests"
cluster: null
deps: []
deps-rfc: []
est-loc: 400
priority: 8
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: "superseded: split into fixtures-add-nontransactional-mode, fixtures-caller-supplied-connection-adapter, and fixtures-delete-direct-adapter-overload"
---

## Context

`fixtures-unify-direct-adapter-path` (#4347) converged the _canonical,
transactional_ direct-adapter `useFixtures(..., () => adapter, ...)` call sites
onto `fixtures()`. Four files still call the lower-level `useFixtures` directly
because `fixtures()` cannot express their semantics:

- `view.test.ts` (ViewWithoutPrimaryKeyTest, UpdateableViewTest) — Rails
  `use_transactional_tests = false`; DML through views must commit and be
  visible across pooled connections, so the savepoint-wrapped transactional path
  breaks them (comment at view.test.ts:222-226).
- `signed-id.test.ts` — uses `setupFixtures()` + `useFixtures` with NO
  transactional wrapper (non-transactional delete/reseed).
- `multiple-db.test.ts` — seeds through model-specific connections
  (`() => College.connection`, `() => Course.connection`); Rails sets
  `use_transactional_tests = false`.
- `transaction-instrumentation.test.ts` — builds its own `sharedAdapter` (no
  pinned outer transaction) to assert non-pinned transaction instrumentation.

The RFC's end goal is a single fixture path with the direct-adapter `useFixtures`
overload deleted (acceptance #2 of `fixtures-unify-direct-adapter-path`, retained
as a documented escape hatch for now — see use-fixtures.ts:307-318).

## Acceptance criteria

- [ ] Add a Rails-faithful NON-transactional mode to the `fixtures()` surface
      (mirrors Rails `use_transactional_tests = false`: per-test delete/reseed,
      no savepoint pin) so `view.test.ts` and `signed-id.test.ts` can converge
      off the direct-adapter path.
- [ ] Decide the multi-DB (`multiple-db.test.ts`) and own-adapter
      (`transaction-instrumentation.test.ts`) story: either a `fixtures()` knob
      for a caller-supplied connection/adapter, or ratify them as a permanently
      documented escape hatch (NOT a deviation to converge — they exercise
      genuinely distinct connection topologies).
- [ ] Once the direct-adapter `useFixtures` overload has zero remaining test-file
      callers, delete it (coordinate with `fixtures-rename-handler-callsites` and
      `fixtures-drop-schema-arg-default-off`). If a permanent escape hatch is
      kept, the export stays but is `@internal` and documented as such.
- [ ] No test names change; test:compare non-negative.
