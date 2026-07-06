---
rfc: "0062-transactional-fixtures-burndown"
title: "Transactional-fixtures burndown: fixtures({}) everywhere"
status: closed
created: 2026-07-04
updated: 2026-07-06
owner: "@deanmarano"
packages:
  - "activerecord"
clusters:
  - fixtures-burndown-a
  - fixtures-burndown-b
  - fixtures-burndown-c
  - fixtures-burndown-d
related-rfcs:
  - "0060-reduce-test-drop-churn"
  - "0019-canonical-schema-burndown"
  - "0014-fixtures-adoption"
---

# RFC 0062 — Transactional-fixtures burndown: `fixtures({})` everywhere

## Summary

Ratchet the ActiveRecord test suite onto transactional fixtures via the
endgame `fixtures({...})` surface (one call = handler + transactional wrapping

- canonical schema), so per-test isolation is a ROLLBACK instead of the global
  truncate reset. This is the Rails model: essentially every Rails AR test runs
  under `use_transactional_tests = true`
  (`vendor/rails/activerecord/lib/active_record/test_fixtures.rb`), and fixture
  rows are inserted once per file, not re-truncated per test.

## Motivation

Counts on main, 2026-07-04: **393** AR test files; only **27** call
`fixtures({` (transactional); **74** still use the legacy `setupFixtures`;
the rest ride the global `beforeEach` truncate reset
(`test-setup-ar.ts` → `resetTestAdapterState` → truncate-based reset,
RFC 0060). Post-#4528, DROP churn is solved (drops −94%, drop:create ~1.3:1),
but every non-transactional file still pays per-test truncation and — on PG —
referential-integrity toggling (96% of PG DDL ms per #4528; also being
attacked by PR #4543 and the insert_fixtures_set story in RFC 0060).
Transactional fixtures eliminate the per-test reset entirely for converged
files, and kill the shared-DB row-leak flake class as a side effect.

This is the natural successor to RFC 0060: 0060 made the _default reset_
cheap; this RFC makes most tests _not need it_.

## Approach

- **No eslint ratchet** (owner directive 2026-07-05): just do the migrations.
  Drive the caller count down directly; no lint rule / exclude-list scaffolding.
- Start with `audit-setupfixtures-caller-buckets`: the ~130 legacy callers are
  NOT a uniform sweep. `fixtures({...})` (`test-helpers/fixtures.ts:64`) composes
  `setupHandlerSuite()` + `withTransactionalFixtures(() => Base.connection)` +
  `useFixtures()`, so `setupFixtures()` and `useHandlerTransactionalFixtures()`
  are its decomposed pair. Three buckets: (a) `setupFixtures()` redundant beside
  a `fixtures()` call → pure deletion (`fixtures()` already wires the suite);
  (b) the pair with no fixture data (adapter/DDL suites that `createTable` in
  `beforeAll`) → need suite-wiring + txn without a fixture map; (c) `setupFixtures`
  alone → handler-wiring/shared-DB shield only. The audit emits the per-cluster
  conversion cut with real file lists.
- Convert in clusters (associations, persistence, relation, adapters, …),
  small PRs, no test renames, Rails-fidelity rules apply (canonical models +
  real fixture lookups — no shallow mechanical migrations).
- Known hazard (memory + PR #4513): `fixtures({})`'s transaction wrapping
  breaks PG suites that run intentional-error or DDL statements
  (25P02 aborted-transaction poisoning). Those files take
  `fixtures({}, { useTransactionalTests: false })` — currently 0 users — or
  `usesTransaction: [...]` per test, exactly as Rails marks
  `self.use_transactional_tests = false`.
- `setupFixtures` (74 files) is deprecated surface; converge it into
  `fixtures({})` as part of the same sweep, then delete it.

## Sequencing

Proposed after RFC 0060's remeasure (#4528 has effectively provided it), and
after PR #4543 + insert_fixtures_set land, so the per-load fixture cost is
already Rails-shaped and this RFC's before/after deltas measure only the
transactional flip.

## Acceptance / exit criteria

- Every AR test file that can be transactional uses `fixtures({...})` (with the
  documented non-transactional escape hatch where Rails itself opts out).
- `setupFixtures` + `useHandlerTransactionalFixtures` deleted.
- Measured: vitest wall time per lane before/after; shared-DB row-leak flake
  re-run rate down.

## Stories (initial cut)

1. `audit-setupfixtures-caller-buckets` (filed, ready) — categorize all legacy
   callers into the three buckets; emit the per-cluster conversion cut. No code.
2. `converge-setupfixtures-redundant-next-to-fixtures` (filed, ready) — bucket
   (a): delete redundant `setupFixtures()` calls beside a `fixtures()` call.
3. Per-cluster conversion stories (buckets b/c + bare-truncate files) — filed
   from the audit's findings with real file lists, ~10–20 files / <500 LOC each.
4. `txn-fixtures-pg-nontransactional-escapes` — annotate deliberate-error/DDL
   suites with the Rails-mirroring `useTransactionalTests: false` opt-out.
5. `delete-setupfixtures-surface` (filed) — terminal removal once callers hit zero.
