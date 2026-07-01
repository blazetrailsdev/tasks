---
title: "Add caller-supplied connection/adapter knob to fixtures(); converge multiple-db + transaction-instrumentation"
status: claimed
updated: 2026-07-01
rfc: "0048-one-schema-no-drop-tests"
cluster: null
deps:
  - fixtures-add-nontransactional-mode
deps-rfc: []
est-loc: 250
priority: 8
pr: null
claim: "2026-07-01T22:46:18Z"
assignee: "fixtures-caller-supplied-connection-adapter"
blocked-by: null
---

## Context

Split from `fixtures-converge-or-ratify-remaining-direct-adapter-callers`
(RFC 0048). Two suites seed through non-default connection topologies that
`fixtures()` cannot currently express, so they call the direct-adapter
`useFixtures(map, () => adapterOrConnection)` overload:

- `packages/activerecord/src/multiple-db.test.ts:31-44` — seeds through
  model-specific connections: `useFixtures(["colleges"], () => College.connection)`,
  `useFixtures(["courses"], () => Course.connection)`, and
  `useFixtures([...], () => Entrant.connection)`. Rails sets
  `use_transactional_tests = false` (comment at `multiple-db.test.ts:19-21`).
- `packages/activerecord/src/transaction-instrumentation.test.ts:64-79` — builds
  its own `sharedAdapter` (`freshAdapter()` in `beforeEach`, assigned to
  `Topic.adapter`) and calls
  `useFixtures({ topics: [Topic, topicFixtureData] }, () => sharedAdapter)` to
  assert non-pinned transaction instrumentation (comment at `:27-28`).

Decision from the parent story: these exercise genuinely distinct connection
topologies, and we want a real `fixtures()` knob (NOT ratify-as-escape-hatch)
so the direct-adapter overload can eventually be deleted.

`fixtures()` is at `packages/activerecord/src/test-helpers/fixtures.ts:40-62`;
the direct-adapter overload it wraps is at
`packages/activerecord/src/test-helpers/use-fixtures.ts:306-318`.

## Acceptance criteria

- [ ] Add a caller-supplied connection/adapter knob to the `fixtures()` surface
      (e.g. accept a `() => connection` / `() => adapter` thunk, or per-fixture-set
      connection) that composes with the non-transactional mode added in
      `fixtures-add-nontransactional-mode`.
- [ ] Converge `multiple-db.test.ts` (colleges/courses/entrants via
      `*.connection`) and `transaction-instrumentation.test.ts` (own
      `sharedAdapter`) off the direct-adapter `useFixtures` path onto
      `fixtures()`.
- [ ] No test names change; `test:compare` non-negative.
- [ ] Does NOT delete the direct-adapter overload — leave that to
      `fixtures-delete-direct-adapter-overload`.
