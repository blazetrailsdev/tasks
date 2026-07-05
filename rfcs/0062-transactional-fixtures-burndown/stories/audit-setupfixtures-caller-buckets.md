---
title: "Audit setupFixtures/useHandlerTransactionalFixtures callers into conversion buckets"
status: claimed
updated: 2026-07-05
rfc: "0062-transactional-fixtures-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: 120
priority: 1
pr: null
claim: "2026-07-05T02:22:27Z"
assignee: "audit-setupfixtures-caller-buckets"
blocked-by: null
closed-reason: null
---

## Context

RFC 0062 (transactional-fixtures burndown). Foundational audit that produces the
per-cluster conversion story cut, so the sweep is NOT mis-specified as a uniform
"replace setupFixtures with fixtures({})" (it isn't — see buckets below). Mirrors
the fidelity-first playbook: real caller lists, no shallow mechanical renames.

`fixtures({...})` (`test-helpers/fixtures.ts:64`) composes exactly
`setupHandlerSuite()` + `withTransactionalFixtures(() => Base.connection)` +
`useFixtures()` (see `test-helpers/use-handler-fixtures.ts`). So `setupFixtures()`
(= `setupHandlerSuite()`, `fixtures.ts:91`) and `useHandlerTransactionalFixtures()`
(= `withTransactionalFixtures(() => Base.connection)`,
`use-handler-transactional-fixtures.ts:34`) are the _decomposed_ pair of the same
wiring `fixtures({})` collapses.

Caller buckets (branch count 2026-07-04, `git grep -l ... '*.test.ts' | grep -v
test-helpers/`; main is lower — re-count at claim):

- **Pair, no fixture data (~66 files):** `setupFixtures()` +
  `useHandlerTransactionalFixtures()`, e.g. `adapters/postgresql/array.test.ts`,
  `adapters/abstract-mysql-adapter/adapter-prevent-writes.test.ts`. These
  `createTable()` in `beforeAll` and declare NO canonical fixture map, so they
  can't become `fixtures({...})` verbatim — they need suite-wiring + a per-test
  transaction _without_ fixtures (candidate: `fixtures([], {...})` empty-name
  form, or a retained combined no-data helper). Decide the surface here.
- **setupFixtures redundant beside fixtures() (subset of ~60 sf-only):**
  `setupFixtures()` on the same file as a `fixtures([...])` call, e.g.
  `adapters/abstract-mysql-adapter/mysql-explain.test.ts:14,28`. `fixtures()`
  ALREADY calls `setupHandlerSuite()` internally, so the `setupFixtures()` line
  is dead double-wiring → pure deletion, zero behavior change.
- **setupFixtures-only, no fixtures (rest of ~60):** pure handler-wiring /
  shared-DB shield with manual `createTable()`, e.g.
  `adapters/abstract-mysql-adapter/schema-migrations.test.ts:25`. No fixture
  data, no transaction — genuinely need only the suite wiring.

## Acceptance criteria

- Produce a categorized inventory (checked-in doc or the RFC body) of every
  non-`fixtures({})` AR test file into the three buckets above, with counts and
  the canonical target per bucket.
- Decide + record the no-fixture-data surface (empty-name `fixtures([], ...)` vs
  a retained combined helper) so the pair-only files have a defined destination.
- Emit the conversion story cut (per-cluster, ~10-20 files each, sized <500 LOC)
  as new RFC 0062 stories with real file lists — not blind placeholders.
- No code conversion in this story (audit only). No test renames.
