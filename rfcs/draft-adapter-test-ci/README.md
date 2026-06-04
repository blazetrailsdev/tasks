---
rfc: "draft-adapter-test-ci"
title: "Adapter test-CI: wire the live-DB lane + the test:compare gate machinery"
status: draft
created: 2026-06-04
updated: 2026-06-04
owner: "@dmarano"
packages:
  - activerecord
clusters:
  - ci-lane
  - gates
---

<!-- Unnumbered until merge: keep `rfc:` as draft-adapter-test-ci and the H1
     below number-free. `scripts/finalize-rfc.mjs` assigns the number at merge. -->

# RFC — Adapter test-CI: wire the live-DB lane + the test:compare gate machinery

## Summary

Two adapter-CI initiatives, both nearly complete, consolidated from
`adapter-test-ci-coverage-plan.md` and `ci-gates-plan.md`. The live-DB adapter
dirs (`adapters/postgresql/**`, the MySQL adapter dirs) now pass **0 failures**
after a long bucket-fix campaign; the **only remaining step is wiring the lane
into CI** (~40 LOC). Separately, the `test:compare` **gate machinery**
(`describeIf*` / `itIfSupports` + Rails-gate extraction) shipped and is advisory;
the residual work is a per-file gate-mismatch cleanup. This RFC tracks those two
remainders; everything else is recorded as shipped in §Done.

## Motivation

`vitest.config.ts` excludes the live-DB adapter suites (`adapters/postgresql/**`,
`adapters/mysql2/**`, `adapters/abstract-mysql-adapter/**`, the `tasks/<db>-*`
and `connection-adapters/mysql2-*` files) from the shared
`pnpm vitest run packages/activerecord/` invocation — they build their own
adapter and assume their tables survive a `describe`, so interleaving with the
shared suite (which drops tables) corrupts state. As a result those ~135 tests
**never ran in CI** — they were local-verify-only, so regressions in PG/MySQL
adapter behavior were invisible to the gate.

The probe (PR #2863, do-not-merge) surfaced ~38 pre-existing failures; the
bucket-fix campaign drove that to **0** (PG and MySQL both green). The lane is
now safe to turn on — that's the payoff this RFC closes.

## Design

### Cluster `ci-lane` — turn the adapter dirs into a green CI gate

The `RUN_ADAPTER_DIRS=1` env gate (drops `ADAPTER_SPECIFIC_EXCLUDE` for one
vitest process) is already on `main`. Productionizing is ~40 LOC: add a second
vitest **step** to the existing `postgres-tests` and `mysql-tests` jobs (reusing
the service container + build), running in its own process so it never
interleaves with the shared suite.

- **PG step** runs only the excluded targets — `adapters/postgresql/**` +
  `tasks/postgresql-database-tasks.test.ts` (the `connection-adapters/postgresql/**`
  - top-level `postgresql-adapter*.test.ts` files are **not** excluded and
    already run in the shared suite; adding them double-runs).
- **MySQL step** runs `adapters/abstract-mysql-adapter`, `adapters/mysql2`,
  `connection-adapters/mysql` (the substring that catches the excluded
  `connection-adapters/mysql2-adapter.test.ts`), and explicitly
  `tasks/mysql-database-tasks.test.ts` (no dir prefix is a substring of it).
- Keep `AR_DB_FORKS=4` + the PG/MySQL `retry: 2`. Start MySQL `continue-on-error`
  if needed; PG can go straight to a **hard gate** (0 failures). Relocate from
  PR #2863's prototype `*-adapter-tests` jobs.

### Cluster `gates` — finish the advisory gate-mismatch cleanup

The gate machinery shipped (#2856/#2880/#2884): `describeIfPg/Mysql/Sqlite`,
`itIfSupports` + the `SUPPORTS` registry, Ruby + TS gate extraction, and the
`test:compare --gates` mismatch classifier (should-gate / missing-gate /
wrong-gate / over-gated). It is **advisory — never fails CI**. The remaining
work is reducing the mismatch count toward 0 per file:

- **wrong-gate / over-gated** — reconcile our gate to Rails' (prefer
  `itIfSupports("<feature>")` where Rails gates by feature). Mechanical.
- **missing-gate** — judgment call: if our impl passes on every backend, leave
  it un-gated (we're legitimately more portable) and note it; else add the gate.
- **should-gate is NOT a mechanical win.** Empirically ~all should-gate
  `it.skip`s are unimplemented-feature/infra **stubs**, not "flip the skip to a
  gate" cases — they are _implementation-time guidance_ (gate it when you build
  the feature), not backlog. Do not bulk-convert.

## Alternatives considered

- **A dedicated adapter-only CI job.** Rejected by the owner — extend the
  existing `postgres-tests` / `mysql-tests` jobs with a second step instead, so
  no extra runner slot and the service/build are reused.
- **Fold the adapter dirs into the core vitest invocation.** Rejected — the
  shared suite drops tables; a separate process is required (see Motivation).
- **Bulk-convert should-gate skips to gates.** Rejected — they're feature stubs;
  converting hides missing implementations behind a green gate.

## Rollout

1. **`ci-lane`:** [wire-adapter-dir-lane](stories/wire-adapter-dir-lane.md) —
   the last step of the coverage plan; PG hard-gate, MySQL once confirmed.
2. **`gates`:** [gate-mismatch-cleanup](stories/gate-mismatch-cleanup.md) —
   ongoing, advisory; per-file until `grandGateMismatch → 0`.

## Open questions

1. **MySQL lane: hard gate vs continue-on-error at first.** PG is 0-failures and
   can hard-gate immediately. MySQL is also 0 but newer (mysql:8 swap landed in
   #2897) — start non-blocking for one or two runs, or trust the probe and
   hard-gate directly?
2. **mysql:8 CI cost.** mysql:8 is ~2.5× slower than the old MariaDB service
   (intrinsic transactional-DDL cost); tmpfs (#2907) recovered ~20%. The owner
   accepted mysql:8 for dialect fidelity; per-test DDL reduction rides on the
   fixtures-migration effort (separate RFC). Tracked here only as context — not
   a story.

## Done (shipped — recorded so the source docs can be deleted)

- **Service + exclusion:** MariaDB→**mysql:8** swap + drop `TEST_ADAPTER`
  exclusion (now unconditional) + gate adapter-dir tests (#2897); mysql data dir
  on tmpfs (#2907); sqlite3 adapter tests gated behind `describeIfSqlite`
  (#2908).
- **PG buckets:** §4 cross-file isolation / search_path restore (#2878); P-1 /
  P-7 / M-5 re-confirmed resolved; P-3 virtual/stored `createTable` GENERATED
  clause (#2898); P-6 hstore store accessors (#2893); P-8 network IPv4-mapped
  IPv6 (#2881); Epic 3.3-U3 `emitTable`→`columnSpec` / PR C (#2899); P-9
  schema-dump shorthand serial/bigserial/bitVarying/array (#2904); P-money
  multi-cast `splitPgDefault` regex (#2915).
- **MySQL buckets:** M-2/M-3/M-4 re-confirmed against mysql:8 (#2900); M-1a/M-1b
  addColumn charset/collation + LOWER/BINARY uniqueness (#2906).
- **Gate machinery:** Ruby gate extraction + `TestGate` + helper (#2856); TS
  `describeIf*` / `itIfSupports` extraction (#2880); `--gates` diagnostics
  (#2884); wrong-gate `itIfSupports` cleanup pass (#2890).

Result: `adapters/postgresql/**` and the MySQL adapter dirs are **0 failures**
on the probe; only the lane wiring remains.

## Changelog

- 2026-06-04: initial RFC, consolidated from `adapter-test-ci-coverage-plan.md`
  (pruned to remaining work in #2901) + `ci-gates-plan.md` during the RFC 0011
  cutover.
