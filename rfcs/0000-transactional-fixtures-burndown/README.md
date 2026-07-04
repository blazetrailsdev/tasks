---
rfc: "0000-transactional-fixtures-burndown"
title: "Transactional-fixtures burndown: fixtures({}) everywhere"
status: draft
created: 2026-07-04
updated: 2026-07-04
owner: "@your-handle"
packages:
  - "activerecord"
clusters: []
related-rfcs:
  - "0060-reduce-test-drop-churn"
  - "0019-canonical-schema-burndown"
  - "0014-fixtures-adoption"
---

# RFC — Transactional-fixtures burndown: `fixtures({})` everywhere

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

## Approach (RFC 0019 burndown playbook)

- Baseline exclude list = the non-`fixtures({})` AR test files; a lint/ratchet
  forbids new files off the surface and fails on stale entries (mirror the
  0019 `require-canonical-schema` ratchet mechanics).
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

- Ratchet at zero: every AR test file uses `fixtures({...})` (with the
  documented non-transactional escape hatch where Rails itself opts out).
- `setupFixtures` deleted.
- Measured: vitest wall time per lane before/after; shared-DB row-leak flake
  re-run rate down.

## Stories (initial cut)

1. `txn-fixtures-ratchet-baseline` — lint rule + exclude-list baseline (no
   conversions).
2. `converge-setupfixtures-callers-fixtures` — mechanical-ish sweep of the 74
   `setupFixtures` files onto `fixtures({})` (split by cluster if >500 LOC).
3. Per-cluster conversion stories for the remaining bare files (associations /
   persistence / relation / adapter suites), sized ~10–20 files each.
4. `txn-fixtures-pg-nontransactional-escapes` — audit + annotate the
   deliberate-error/DDL suites with the Rails-mirroring opt-out.
5. `delete-setupfixtures-surface` — final removal once callers are at zero.
