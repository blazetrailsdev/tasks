---
rfc: "0000-sqlite-memory-fidelity"
title: "SQLite :memory: test fidelity — match Rails' file-backed default and ambient-connection pattern"
status: draft
created: 2026-06-15
updated: 2026-06-15
owner: "@deanmarano"
packages:
  - activerecord
clusters:
  - worker-db
  - test-connection-fidelity
  - adapter-test-fidelity
related-rfcs:
  - "0019-canonical-schema-burndown"
  - "0026-adapter-layout-fidelity"
---

# RFC — SQLite `:memory:` test fidelity

## Summary

The AR test suite reaches for SQLite `:memory:` in ~75 source locations
(327 raw occurrences across `packages/activerecord/src/**/*.ts`). In Rails,
`:memory:` is **not** the default — it is a specific, opt-in connection
profile (`sqlite3_mem`, selected via `ARCONN=sqlite3_mem`). Rails' default
`sqlite3` connection is **file-backed**
(`FIXTURES_ROOT/fixture_database.sqlite3` + `fixture_database_2.sqlite3`),
and Rails' own test suite hardcodes `database: ":memory:"` in only **10 test
files**. Everywhere else, Rails tests run against the ambient, file-backed
`arunit`/`arunit2` connections.

This RFC audits every trails `:memory:` site against its Rails counterpart and
converges the divergences. The good news up front: the **default worker DB is
already file-backed** in the primary CI path (the globalSetup template-clone
gives each worker an on-disk DB — see [Design](#design)), so the foundational
fidelity property is intact. The divergences are (1) a latent `:memory:`
_fallback_ default in the worker-DB plumbing plus a stale comment that
mis-describes it, and (2) a cluster of individual test files that hardcode
`:memory:` connections where the matching Rails test uses the ambient
file-backed connection or — in the multi-database cases — explicit on-disk
file paths.

## Motivation

Fidelity is the project's #1 rule (see `CLAUDE.md`, RFC 0019). `:memory:`
hides behaviors that a file-backed SQLite DB exercises and that Rails' default
suite therefore exercises: real disk I/O, WAL journaling, durability/`fsync`,
`ATTACH`/multi-database wiring, and cross-connection visibility. A test that
passes only because every connection secretly shares (or secretly cannot
share) one process-local in-memory DB is not testing what Rails tests.

Concrete evidence — Rails uses `:memory:` in exactly these test files
(`grep -rl ':memory:' vendor/rails/activerecord/test/cases/`):

| Rails test file                                                     | `:memory:` lines |
| ------------------------------------------------------------------- | ---------------- |
| `cases/adapters/sqlite3/sqlite3_adapter_test.rb`                    | 18               |
| `cases/connection_adapters/connection_handlers_sharding_db_test.rb` | 6                |
| `cases/shard_keys_test.rb`                                          | 5                |
| `cases/tasks/database_tasks_test.rb`                                | 2                |
| `cases/database_configurations_test.rb`                             | 2                |
| `cases/database_configurations/resolver_test.rb`                    | 2                |
| `cases/migration/foreign_key_test.rb`                               | 1                |
| `cases/fixtures_test.rb`                                            | 1                |
| `cases/connection_adapters/connection_handlers_multi_db_test.rb`    | 1                |
| `cases/adapters/sqlite3/transaction_test.rb`                        | 1                |

Two decisive contrasts found while auditing:

- **`connection_swapping_nested_test.rb`** builds its four databases with
  on-disk paths — `"adapter" => "sqlite3", "database" => "test/db/primary.sqlite3"`,
  `.../secondary.sqlite3`, etc. (lines 51–54). trails'
  `connection-swapping-nested.test.ts` hardcodes `database: ":memory:"` for all
  four (36 occurrences). Rails uses files **deliberately** here so the four
  pools address genuinely distinct databases; `:memory:` makes that test weaker.
- **`connection_pool_test.rb` / `adapter_test.rb`** never name a database — they
  derive their config from the ambient pool
  (`ActiveRecord::Base.connection_pool.db_config`, `lease_connection`,
  `establish_connection :arunit`) and merge options onto it (lines 20–29, 13,
  163–189). trails' `connection-pool.test.ts` / `adapter.test.ts` hardcode
  `:memory:` instead, which means they never run against the file-backed default
  the way Rails does.

## Design

### The default worker DB is already file-backed (verified)

`AR_TEST_WORKER_DB` defaults to `:memory:` in
`test-helpers/test-database-config.ts:39,102` — but in the live CI path that
default is **never reached**. The `activerecord` vitest project wires
`globalSetup: template-global-setup.ts`, whose SQLite adapter builds the
canonical schema into an on-disk template file and provisions per-worker
clones; `test-setup-worker-db.ts:155` calls `ensureWorkerClone()` and stamps
the resulting **file path** into `AR_TEST_WORKER_DB`. So every worker in a
normal `pnpm vitest run packages/activerecord/` invocation runs against an
on-disk per-worker `.sqlite` file (`ar-test-worker-<token>-<slot>.sqlite`),
which matches Rails' file-backed `sqlite3` profile in spirit (real disk I/O,
WAL, durability).

Two residual gaps remain:

1. **The fallback default is `:memory:`.** If globalSetup did not provision
   (template build skipped, a setup-free code path, or a future refactor),
   `getEnv("AR_TEST_WORKER_DB") ?? ":memory:"` silently drops back to in-memory
   instead of a file. The fallback should itself be file-backed so the suite
   never silently loses fidelity.
2. **A stale comment asserts the wrong thing.** `vitest.config.ts:206` reads
   _"SQLite uses :memory: which is isolated per fork by default."_ That is no
   longer true — workers use on-disk clones. Misleading comments cause exactly
   the kind of wrong mental model this RFC exists to correct.

Per-worker file isolation here is a trails parallelism adaptation (Rails runs
its file DBs at lower fork counts); file-backed-ness is the fidelity property,
per-worker pathing is acceptable infra. **Interaction with the shared-worker-DB
flake work** (the items/posts/people/accounts shared-table flakes tracked in
memory + RFC 0019): the worker-DB stories here must not change the per-worker
_isolation_ model — each worker keeps its own file. Sequence the fallback
change (`worker-db-fallback-file-backed`) so it does not race those flake
fixes; it is additive (fallback only) and should not move the primary path, but
it touches the same plumbing, so it is flagged.

### Classification method

For each trails `:memory:` site: (a) find the Rails counterpart test via the
file-structure manifest / `test:compare` naming, (b) check whether that Rails
file uses `:memory:`/`sqlite3_mem` in the corresponding location, (c) classify:

- **fidelity-correct** — Rails uses `:memory:` there too → leave untouched.
- **divergence** — Rails uses a file-backed DB (ambient `arunit` or explicit
  on-disk path) there → write a convergence story.
- **trails-only** — no Rails counterpart; judge against the nearest Rails
  convention. trails' driver-abstraction layer (`sqlite/*`, `sqlite-adapter`)
  and the `establishConnection` API tests legitimately use `:memory:` as a
  no-disk fixture and are left alone.

### Divergence map

`✓` = fidelity-correct (leave), `✗` = divergence (story), `~` = trails-only /
partial (judge / verify). Counts are `:memory:` occurrences per file.

| trails file                                                                                                                                                                                                                                                                                       | n   | Rails counterpart                                    | Rails :memory: here?              | Verdict                 | Story                                    |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --- | ---------------------------------------------------- | --------------------------------- | ----------------------- | ---------------------------------------- |
| `test-helpers/test-database-config.ts`                                                                                                                                                                                                                                                            | 2   | `config.example.yml` default `sqlite3` (file-backed) | No (file)                         | ✗ fallback              | `worker-db-fallback-file-backed`         |
| `vitest.config.ts:206` (comment)                                                                                                                                                                                                                                                                  | —   | —                                                    | n/a (stale)                       | ✗                       | `worker-db-fallback-file-backed`         |
| `connection-adapters/connection-swapping-nested.test.ts`                                                                                                                                                                                                                                          | 36  | `connection_swapping_nested_test.rb:51-54`           | No — `test/db/*.sqlite3`          | ✗                       | `connection-swapping-nested-file-based`  |
| `tasks/database-tasks.test.ts`                                                                                                                                                                                                                                                                    | 30  | `tasks/database_tasks_test.rb`                       | Only 2 of 30                      | ✗ (28 excess)           | `database-tasks-test-config-fidelity`    |
| `adapter.test.ts`                                                                                                                                                                                                                                                                                 | 8   | `adapter_test.rb:13,163-189`                         | No — `lease_connection`/`:arunit` | ✗                       | `adapter-test-ambient-connection`        |
| `statement-cache.test.ts`                                                                                                                                                                                                                                                                         | 8   | `statement_cache_test.rb`                            | No — ambient/fixtures             | ✗                       | `statement-cache-ambient-connection`     |
| `adapters/sqlite3/statement-pool.test.ts`                                                                                                                                                                                                                                                         | 8   | `adapters/sqlite3/statement_pool_test.rb`            | No (0) — ambient                  | ✗                       | `sqlite3-statement-pool-ambient`         |
| `connection-handling.test.ts`                                                                                                                                                                                                                                                                     | 7   | `connection_handling_test.rb`                        | No — `connects_to`/ambient        | ✗                       | `connection-handling-ambient-connection` |
| `connection-adapters/abstract/schema-statements-on-adapter.test.ts`                                                                                                                                                                                                                               | 6   | abstract schema-statements                           | No — ambient                      | ✗                       | `schema-statements-on-adapter-ambient`   |
| `transactions.test.ts`                                                                                                                                                                                                                                                                            | 4   | `transactions_test.rb`                               | No — fixtures/ambient             | ✗                       | `transactions-ambient-connection`        |
| `connection-pool.test.ts`                                                                                                                                                                                                                                                                         | 3   | `connection_pool_test.rb:20-29`                      | No — `db_config`-derived          | ✗                       | `connection-pool-derive-from-ambient`    |
| `connection-adapters/connection-handlers-multi-db.test.ts`                                                                                                                                                                                                                                        | 13  | `connection_handlers_multi_db_test.rb`               | Yes (1) — partial                 | ~ verify excess         | `audit-residual-memory-sites`            |
| `connection-adapters/connection-handlers-sharding-db.test.ts`                                                                                                                                                                                                                                     | 22  | `connection_handlers_sharding_db_test.rb`            | Yes (6) — partial                 | ~ verify excess         | `audit-residual-memory-sites`            |
| `shard-keys.test.ts`                                                                                                                                                                                                                                                                              | 5   | `shard_keys_test.rb`                                 | Yes (5)                           | ✓                       | —                                        |
| `database-configurations/resolver.test.ts`                                                                                                                                                                                                                                                        | 2   | `database_configurations/resolver_test.rb`           | Yes (2)                           | ✓                       | —                                        |
| `connection-adapters/adapter-args.test.ts`                                                                                                                                                                                                                                                        | 5   | `database_configurations/resolver_test.rb`           | Yes (resolver-aligned)            | ✓                       | —                                        |
| `adapters/sqlite3/sqlite3-adapter.test.ts`                                                                                                                                                                                                                                                        | 19  | `adapters/sqlite3/sqlite3_adapter_test.rb`           | Yes (18)                          | ✓                       | —                                        |
| `adapters/sqlite3-adapter.test.ts` (legacy path)                                                                                                                                                                                                                                                  | 11  | `adapters/sqlite3/sqlite3_adapter_test.rb`           | Yes                               | ~ reconcile w/ RFC 0026 | `audit-residual-memory-sites`            |
| `adapters/sqlite3/transaction.test.ts`                                                                                                                                                                                                                                                            | 2   | `adapters/sqlite3/transaction_test.rb`               | Yes (1)                           | ✓                       | —                                        |
| `sqlite-adapter.test.ts`                                                                                                                                                                                                                                                                          | 24  | none (driver abstraction)                            | n/a                               | ~ trails-only, leave    | —                                        |
| `sqlite/better-sqlite3.test.ts`, `sqlite/node-sqlite.test.ts`, `sqlite/expo-sqlite.test.ts`                                                                                                                                                                                                       | 7   | none (driver wrappers)                               | n/a                               | ~ trails-only, leave    | —                                        |
| `establish-connection.test.ts`                                                                                                                                                                                                                                                                    | 10  | none (`establishConnection` API)                     | n/a (`:memory:` as spec form)     | ~ trails-only, leave    | —                                        |
| long tail: `connection-handler`, `pool-config`, `pool-manager`, `schema-cache`, `disconnected`, `unconnected`, `multiple-db`, `multi-db-migrator`, `primary-class`, `transaction-instrumentation`, `connection-adapters/statement-pool`, `type-lookup`, `quoting-interface`, others (1–2 each)    | ~25 | various                                              | mixed                             | ~ per-line audit        | `audit-residual-memory-sites`            |
| source files (not tests): `connection-adapters/sqlite3-adapter.ts`, `sqlite-adapter.ts`, `model-schema.ts`, `connection-handling.ts`, `database-configurations/url-config.ts`, `tasks/sqlite-database-tasks.ts`, `tasks/database-tasks.ts`, `adapter-args.ts`, `test-databases.ts`, `sqlite/*.ts` | ~35 | Rails sqlite adapter special-cases `:memory:`        | Yes (production handling)         | ✓ out of scope          | —                                        |

### Scope boundary

This RFC covers **test + test-helper** `:memory:` usage only. Source files that
_implement_ `:memory:` handling (the SQLite adapter's special-casing of the
in-memory database name, URL parsing, database-tasks no-op-on-`:memory:`
branches) are Rails-faithful production behavior and are explicitly out of
scope.

The audit is **one-directional** — it asks "where _trails_ uses `:memory:`,
does Rails?" The reverse direction (Rails uses `:memory:` where trails does
not) is out of scope but was observed and is recorded here so it is not
mistaken for a clean bidirectional match: Rails' `database_configurations_test.rb`
(2 sites) has a trails counterpart `database-configurations.test.ts` that uses
**no** `:memory:`; `migration/foreign_key_test.rb:625` and
`fixtures_test.rb:606` (`ENV["DATABASE_URL"] = "sqlite3::memory:"`) likewise have
no `:memory:` in their trails equivalents. These are config/URL-parsing cases
where `:memory:` is often the fidelity-correct value to _add_. They are
candidate follow-ups, not stories in this RFC; flag them to a future
reverse-direction sweep (or `0023-surfaced-deviations`) rather than widening
this RFC's trails→Rails scope.

## Alternatives considered

- **Flip `AR_TEST_WORKER_DB` default to a file and call it done.** Rejected as
  insufficient: the default is already effectively file-backed via globalSetup,
  so this alone changes nothing observable, and it ignores the ~60 individual
  test-file divergences that are the substance of the fidelity gap.
- **Bulk sed `:memory:` → file path.** Rejected: many sites are
  fidelity-correct (the 10 Rails files + driver layer + API tests). A blind
  rewrite would _introduce_ divergence and break the driver/`establishConnection`
  tests that legitimately use `:memory:`. Each site must be judged against its
  Rails counterpart.
- **One mega-PR.** Rejected: violates the trails 500-LOC ceiling and the
  one-agent-per-PR model. Split per file/area.

## Rollout

1. **Foundational** — `worker-db-fallback-file-backed` (sequence away from
   shared-DB flake work; additive).
2. **High-value, isolated** — `connection-swapping-nested-file-based` (biggest
   single-file divergence; Rails uses explicit file paths).
3. **Ambient-connection cluster** (independent, one file each, parallelizable) —
   `adapter-test-ambient-connection`, `connection-pool-derive-from-ambient`,
   `connection-handling-ambient-connection`, `statement-cache-ambient-connection`,
   `transactions-ambient-connection`, `sqlite3-statement-pool-ambient`,
   `schema-statements-on-adapter-ambient`.
4. **Larger single file** — `database-tasks-test-config-fidelity` (28 excess
   sites; keep under 500 LOC, split via a follow-up story if needed).
5. **Sweep** — `audit-residual-memory-sites` runs first within its own scope to
   classify the long tail and the partial-audit files (multi-db / sharding count
   deltas, legacy sqlite3-adapter path), spinning convergence stories for any
   real divergence it finds.

## Open questions

1. **Per-worker file path vs Rails' fixed `FIXTURES_ROOT` path.** Rails uses two
   fixed files; trails uses per-worker tmp clones for parallelism. Recommendation:
   keep per-worker pathing (it is infra, not behavior) — the fidelity property is
   file-backed-ness, which is preserved.
2. **Should the ambient-connection stories share a helper?** Several files would
   converge to the same "derive a HashConfig from the live test config and merge
   options" pattern. Recommendation: let the first ambient story
   (`adapter-test-ambient-connection`) introduce the helper if one is warranted;
   later stories reuse it. Do not pre-build an empty helper (CLAUDE.md: no stubs).

## Stories

One story per independently-shippable fidelity fix. The ambient-connection
stories (cluster `test-connection-fidelity`) are mutually independent — each
touches a single test file — and can be claimed in parallel. The audit story
should be claimed first within the sweep so its findings can register any
additional stories before agents touch the long-tail files.

<!-- This table is AUTO-GENERATED from story frontmatter by
     scripts/stories-table.mjs (run by the pre-commit hook). Do NOT hand-edit
     it — edits are overwritten on commit, and `pnpm validate` fails on drift. -->

<!-- generated: stories table -->

| ID                                                                                          | Title                                                                                     | Status | Est LOC | Cluster                  |
| ------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- | ------ | ------- | ------------------------ |
| [adapter-test-ambient-connection](stories/adapter-test-ambient-connection.md)               | adapter.test.ts: derive connection from ambient test config, not :memory:                 | draft  | 60      | test-connection-fidelity |
| [audit-residual-memory-sites](stories/audit-residual-memory-sites.md)                       | Audit residual :memory: sites (long tail + partial-audit files), spin convergence stories | draft  | 30      | adapter-test-fidelity    |
| [connection-handling-ambient-connection](stories/connection-handling-ambient-connection.md) | connection-handling.test.ts: use ambient/connects_to config, not :memory:                 | draft  | 55      | test-connection-fidelity |
| [connection-pool-derive-from-ambient](stories/connection-pool-derive-from-ambient.md)       | connection-pool.test.ts: derive PoolConfig from ambient db_config like Rails              | draft  | 45      | test-connection-fidelity |
| [connection-swapping-nested-file-based](stories/connection-swapping-nested-file-based.md)   | connection-swapping-nested: use file-backed per-database DBs like Rails                   | draft  | 90      | test-connection-fidelity |
| [database-tasks-test-config-fidelity](stories/database-tasks-test-config-fidelity.md)       | database-tasks.test.ts: converge 28 excess :memory: sites to Rails config fidelity        | draft  | 150     | test-connection-fidelity |
| [schema-statements-on-adapter-ambient](stories/schema-statements-on-adapter-ambient.md)     | schema-statements-on-adapter.test.ts: use ambient connection, not :memory:                | draft  | 50      | test-connection-fidelity |
| [sqlite3-statement-pool-ambient](stories/sqlite3-statement-pool-ambient.md)                 | adapters/sqlite3/statement-pool.test.ts: use ambient connection like Rails                | draft  | 50      | adapter-test-fidelity    |
| [statement-cache-ambient-connection](stories/statement-cache-ambient-connection.md)         | statement-cache.test.ts: run against ambient connection like Rails                        | draft  | 50      | test-connection-fidelity |
| [transactions-ambient-connection](stories/transactions-ambient-connection.md)               | transactions.test.ts: run against ambient connection like Rails                           | draft  | 45      | test-connection-fidelity |
| [worker-db-fallback-file-backed](stories/worker-db-fallback-file-backed.md)                 | Worker-DB fallback: file-backed default + fix stale :memory: comment                      | draft  | 40      | worker-db                |

## Changelog

- 2026-06-15: initial RFC
  </content>
