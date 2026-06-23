---
rfc: "0012-adapter-test-ci"
title: "Adapter test-CI: wire the live-DB lane + the test:compare gate machinery"
status: closed
created: 2026-06-04
updated: 2026-06-23
owner: "@deanmarano"
packages:
  - activerecord
clusters:
  - ci-lane
  - gates
---

<!-- Unnumbered until merge: keep `rfc:` as 0012-adapter-test-ci and the H1
     below number-free. `scripts/finalize-rfc.mjs` assigns the number at merge. -->

# RFC 0012 — Adapter test-CI: wire the live-DB lane + the test:compare gate machinery

## Summary

Two adapter-CI initiatives, both nearly complete, consolidated from
`adapter-test-ci-coverage-plan.md` and `ci-gates-plan.md`. The live-DB adapter
dirs (`adapters/postgresql/**`, the MySQL adapter dirs) now pass **0 failures**
after a long bucket-fix campaign; the **only remaining step is wiring the lane
into CI** (~40 LOC). Separately, the `test:compare` **gate machinery**
(`describeIf*` / `itIfSupports` + Rails-gate extraction) shipped and is advisory;
the residual work is a per-file gate-mismatch cleanup. This RFC tracks those two
remainders; everything else is recorded as shipped in §Done.

**Both initiatives are "do as Rails does" exercises**, not new design:

- **The lane mirrors Rails' per-adapter test execution.** Rails keeps
  adapter-specific tests under `activerecord/test/cases/adapters/{postgresql,
mysql2,sqlite3}/` and runs each backend's suite in a separate process with that
  backend connected (`bin/test` with the adapter selected via `ARCONN`). Our
  `adapters/<db>/**` layout is the structural mirror; the lane just runs each in
  its own process under the matching CI service — exactly Rails' model.
- **The gate machinery mirrors Rails' test conditionals.** `describeIfPg` ≙
  Rails `current_adapter?(:PostgreSQLAdapter)` (`activerecord/test/cases/helper.rb`);
  `itIfSupports("json", …)` ≙ Rails `skip unless supports_json?`
  (`supports_<feature>?` in `connection_adapters/*_adapter.rb` +
  `abstract/database_statements.rb`); the `adapters/<db>/` directory gate ≙
  Rails' directory layout. The cleanup's job is to make our gate **equal** the
  vendored Rails gate test-for-test.

Vendored Rails is pinned in `vendor/sources.ts` (+ `vendor/sources.lock.json`)
and fetched via `pnpm vendor:fetch`; the Ruby gate extractor reads it
(`scripts/test-compare/extract-ruby-tests.rb`). Cite Rails by its canonical
upstream path — the vendored copy mirrors it.

## Motivation

The repo-root `vitest.config.ts` excludes the live-DB adapter suites from the
shared `pnpm vitest run packages/activerecord/` invocation
(`ADAPTER_SPECIFIC_EXCLUDE`, `vitest.config.ts:34`, applied at
`vitest.config.ts:187`): `adapters/postgresql/**`, `adapters/mysql2/**`,
`adapters/abstract-mysql-adapter/**`, the `tasks/<db>-*` and
`connection-adapters/mysql2-*` files. They build their own adapter and assume
their tables survive a `describe`, so interleaving with the shared suite (which
drops tables) corrupts state. As a result those ~135 tests **never ran in CI** —
local-verify-only — so PG/MySQL adapter regressions were invisible to the gate.

The probe (PR #2863, do-not-merge) surfaced ~38 pre-existing failures; the
bucket-fix campaign drove that to **0** (PG and MySQL both green — see §Done).
The lane is now safe to turn on.

## Design

### Cluster `ci-lane` — turn the adapter dirs into a green CI gate

The `RUN_ADAPTER_DIRS=1` env gate (drops `ADAPTER_SPECIFIC_EXCLUDE` for one
vitest process — `vitest.config.ts:32-35`) is **already on `main`**.
**Decision (was an open question): keep that env gate as the production
mechanism** — no separate vitest config. It is the minimal, already-shipped
lever and mirrors Rails selecting the adapter per process rather than maintaining
a parallel config file.

Productionizing is ~40 LOC: add a second vitest **step** to the existing
`postgres-tests` (`ci.yml:542`) and `mysql-tests` (`ci.yml:588`) jobs, inserted
right after each job's core `pnpm vitest run packages/activerecord/` step
(`ci.yml:580` in `postgres-tests`), reusing the same service container + build,
in its own process so it never interleaves with the shared suite.

- **PG step** runs only the excluded targets: `adapters/postgresql/**` and
  `tasks/postgresql-database-tasks.test.ts`. Note `connection-adapters/postgresql/**`
  and the top-level `postgresql-adapter*.test.ts` are **not** excluded — they
  already run in the shared suite, so adding them here would double-run.
- **MySQL step** runs `adapters/abstract-mysql-adapter`, `adapters/mysql2`,
  `connection-adapters/mysql` (the substring that catches the excluded
  `connection-adapters/mysql2-adapter.test.ts`), and explicitly
  `tasks/mysql-database-tasks.test.ts` (no dir prefix is a substring of it).
- Keep `AR_DB_FORKS=4` + the PG/MySQL `retry: 2`. **Decision (was an open
  question): PG goes straight to a hard gate** (0 failures, stable across rebases);
  **MySQL runs one `continue-on-error` shakedown round, then flips to a hard
  gate** in a one-line follow-up (the mysql:8 service is newer — #2897 — so it
  earns one observed-green CI round before blocking merges). Relocate from PR
  #2863's prototype `*-adapter-tests` jobs.

### Cluster `gates` — finish the advisory gate-mismatch cleanup

The gate machinery shipped (#2856/#2880/#2884): `describeIfPg/Mysql/Sqlite`
(`adapters/<db>/test-helper.ts`), `itIfSupports` + the `SUPPORTS` registry
(`test-helpers/supports.ts:32`), Ruby + TS gate extraction
(`scripts/test-compare/extract-ruby-tests.rb`, `extract-ts-core.ts`), and the
mismatch classifier (`scripts/test-compare/gates.ts`) surfaced by
`pnpm test:compare --gates` (`package.json:30` → `scripts/test-compare/run.sh`).
It is **advisory — never fails CI**.

**Do as Rails does:** every mismatch is reconciled by making our gate equal the
**vendored Rails** gate for that test, verified against the pinned Rails
(`vendor/sources.ts`):

- **wrong-gate / over-gated** — reconcile our gate to Rails'. Prefer
  `itIfSupports("<feature>")` where Rails gates by `supports_<feature>?`, so the
  sets line up by construction; add the key to `SUPPORTS` (`supports.ts:32`),
  verified against the vendored Rails `supports_<key>?` for pg17 / mysql8 /
  sqlite. Mechanical.
- **missing-gate** — judgment call: if our impl passes on the adapter Rails
  excludes, leave it un-gated and **note we are deliberately more portable**
  (a documented divergence, the only acceptable un-reconciled case); else add
  the gate.
- **should-gate is NOT a mechanical win** and is **out of this cluster's scope.**
  Empirically ~all should-gate `it.skip`s are unimplemented-feature/infra stubs
  — Rails gates a feature we haven't built. The gate is added _when the feature
  is built_, which is owned by the feature's RFC (the test-compare-100 attack
  plan), not here. See §Open questions for the done-criterion this implies.

## Alternatives considered

- **A dedicated adapter-only CI job.** Rejected by the owner — extend the
  existing `postgres-tests` / `mysql-tests` jobs with a second step instead, so
  no extra runner slot and the service/build are reused.
- **A separate vitest config for the adapter dirs** (vs the `RUN_ADAPTER_DIRS`
  env gate). Rejected — the env gate already exists (`vitest.config.ts:32`) and a
  parallel config file is exactly the kind of duplicate Rails avoids by
  selecting the adapter per run.
- **Fold the adapter dirs into the core vitest invocation.** Rejected — the
  shared suite drops tables; a separate process is required (see Motivation).
- **Bulk-convert should-gate skips to gates.** Rejected — they're feature stubs;
  converting hides missing implementations behind a green gate.

## Rollout

1. **`ci-lane`:** [wire-adapter-dir-lane](stories/wire-adapter-dir-lane.md) —
   the last step of the coverage plan; PG hard-gate, MySQL shakedown→hard-gate.
2. **`gates`:** [gate-mismatch-cleanup](stories/gate-mismatch-cleanup.md) —
   per-file, until `(wrong-gate + over-gated + reconciled-missing-gate) → 0`.

## Open questions

1. **Done-criterion for `gate-mismatch-cleanup`.** `grandGateMismatch → 0`
   literally **cannot** be reached while should-gate items exist, because they
   are deliberately _not_ converted (feature stubs — gated when the feature
   ships). The story's target is therefore **wrong-gate = 0, over-gated = 0, and
   every missing-gate either gated or documented-as-portable** — should-gate is
   tracked separately and excluded. Confirm this is the intended bar (the story
   encodes it).
2. **mysql:8 CI cost.** mysql:8 is ~2.5× slower than the old MariaDB service
   (intrinsic transactional-DDL cost); tmpfs (#2907) recovered ~20%. The owner
   accepted mysql:8 for dialect fidelity; per-test DDL reduction rides on the
   fixtures-migration effort (separate RFC). Context only — not a story, and not
   a blocker for wiring the lane.

## Done (shipped — recorded so the source docs can be deleted)

- **Service + exclusion:** MariaDB→**mysql:8** swap + drop `TEST_ADAPTER`
  exclusion (now unconditional) + gate adapter-dir tests (#2897); mysql data dir
  on tmpfs (#2907); sqlite3 adapter tests gated behind `describeIfSqlite`
  (#2908).
- **PG buckets:** §4 cross-file isolation / `search_path` restore (#2878,
  mirroring Rails `schema_test.rb` teardown); P-1 / P-7 / M-5 re-confirmed
  resolved; P-3 virtual/stored `createTable` GENERATED clause (#2898, mirroring
  `PostgreSQL::SchemaCreation#add_column_options!`); P-6 hstore store accessors
  (#2893, mirroring `store.rb` + `OID::Hstore`); P-8 network IPv4-mapped IPv6
  (#2881); Epic 3.3-U3 `emitTable`→`columnSpec` / PR C (#2899); P-9 schema-dump
  shorthand serial/bigserial/bitVarying/array (#2904); P-money multi-cast
  `splitPgDefault` regex (#2915).
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
