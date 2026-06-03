---
rfc: "0011-ar-test-isolation-helper"
title: "AR test harness — one isolation helper (useHandlerFixtures) + Rails config fidelity"
status: draft
created: 2026-06-03
updated: 2026-06-03
owner: "@dmarano"
packages:
  - activerecord
clusters:
  - test-isolation-helper
  - test-config-fidelity
related-rfcs:
  - "0008-test-perf-template-clone"
  - "0010-adapter-cleanup"
---

# RFC 0011 — One AR test isolation helper + Rails config fidelity

## Summary

Rails has **exactly one** test-isolation surface: `ActiveRecord::TestCase`
(`include TestFixtures`), opted into by declaring `fixtures :name`, with
`use_transactional_tests` on by default. Every AR test — including the adapter
tests under `test/cases/adapters/**` — is that same class on the same shared
connection, and isolation costs a `ROLLBACK`, not a schema rebuild.

We have a faithful port of the rollback mechanism
([`with-transactional-fixtures.ts`](https://github.com/blazetrailsdev/trails/blob/main/packages/activerecord/src/test-helpers/with-transactional-fixtures.ts))
but **three** overlapping public helpers wrapping it, and only ~8% of files
(39 / 504) actually use the rollback path. The other ~92% rebuild schema and/or
reset adapter state per test, which is why the suite gets slower as tests are
added. This RFC converges on **one helper, `useHandlerFixtures`**, migrates
files onto it, and — separately — closes the Rails test-connection-config gaps
(`prepared_statements: false`, divergent collation, etc.) that we don't yet
exercise in CI.

Migrated from
[`trails/docs/activerecord/adapter-test-ci-coverage-plan.md`](https://github.com/blazetrailsdev/trails/blob/main/docs/activerecord/adapter-test-ci-coverage-plan.md)
§9–§10.

## Motivation

**Isolation cost (cluster `test-isolation-helper`).** Adoption of the
rollback path is the problem:

| Isolation strategy                                                  | AR test files      | Per-test cost                        |
| ------------------------------------------------------------------- | ------------------ | ------------------------------------ |
| transactional-fixtures (rollback)                                   | **39 / 504** (~8%) | one `ROLLBACK`                       |
| `defineSchema` per file + global `resetTestAdapterState` beforeEach | **184 / 504**      | rebuild schema / reset adapter state |

On top of that we expose **three** helpers where Rails has one concept:

| Helper                                | Rails analog                                | Why it exists today                                                                                                                                                            |
| ------------------------------------- | ------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `useHandlerFixtures(...)`             | `ActiveRecord::TestCase` + `fixtures :name` | the intended surface                                                                                                                                                           |
| `useHandlerTransactionalFixtures()`   | `ActiveRecord::TestCase` (no `fixtures`)    | only `useHandlerFixtures` with zero fixtures — exists because we lack Ruby's class-level opt-in                                                                                |
| `setupAdapterSuite({ factory, ... })` | _(none)_                                    | adapter-cluster tests construct a raw `new PostgreSQLAdapter(...)` per file instead of using the shared handler connection — the divergence documented in the coverage-plan §1 |

**Config fidelity (cluster `test-config-fidelity`).** Rails' own test
connections
([`config.example.yml`](https://github.com/rails/rails/blob/main/activerecord/test/config.example.yml))
exercise dimensions our CI never does:

- A dedicated `prepared_statements: false` connection
  (`arunit_without_prepared_statements`) plus a `MYSQL_PREPARED_STATEMENTS`
  toggle. We have the feature (`statement-cache.ts`) but CI only runs PS-on, so
  the unprepared bind/cast path is effectively untested.
- The two test DBs use **deliberately different collations**
  (`utf8mb4_unicode_ci` vs `utf8mb4_general_ci`); `arunit` is pinned
  `time_zone: UTC`; SQLite runs `strict: true`; PG runs `min_messages: warning`.

> Already covered, do NOT re-add: in-memory SQLite (we already run `:memory:`
> per fork) and mysql:8-over-MariaDB (tracked as a coverage-plan §6 decision).

## Design

### End state — one helper

> **Every AR test file uses `useHandlerFixtures(...)` for setup + isolation.
> No other public isolation helper survives.**

`useHandlerFixtures` already bundles `setupHandlerSuite` + transactional
rollback + fixture loading and forwards `usesTransaction` /
`invalidateSchemaCache`. We make `fixtures` optional (so the no-fixtures case is
`useHandlerFixtures()`), then remove the two redundant wrappers:

- **`useHandlerTransactionalFixtures` → deleted**, folded into
  `useHandlerFixtures()`.
- **`setupAdapterSuite` → deleted**, by routing adapter-cluster tests through
  the shared handler connection (closing the coverage-plan §1 divergence). Raw
  DDL hooks (`CREATE EXTENSION`, foreign tables) move to a plain `beforeAll`.

The bare `withTransactionalFixtures` primitive stays as the **internal**
implementation `useHandlerFixtures` calls — not a test-file surface.

### Composition with RFC 0008

This RFC and [RFC 0008](../0008-test-perf-template-clone/README.md) attack
different axes and **compose**:

- **0008** lowers the per-_file_ cost of getting schema in place (clone a
  prebuilt template instead of running N `CREATE TABLE`), keeping `isolate:true`.
- **0011** lowers the per-_test_ cost of isolation (rollback instead of
  rebuild) and unifies the helper API.

Neither blocks the other; a file can be on the template-clone provisioning path
and the `useHandlerFixtures` rollback path simultaneously.

### Config fidelity

Add a `prepared_statements: false` CI dimension for PG (a second vitest step or
env-toggled run) and the `MYSQL_PREPARED_STATEMENTS` toggle for MySQL, plus the
hygiene settings (collation split across the two DBs, `time_zone: UTC`,
SQLite `strict: true`, PG `min_messages: warning`).

## Alternatives considered

- **Keep three helpers.** Rejected — they're one concept (Rails proves it). Two
  are pure redundancy; the third only exists to paper over a non-Rails pattern.
- **Migrate isolation but leave `setupAdapterSuite`.** Rejected — it perpetuates
  the raw-adapter-per-file divergence (coverage-plan §1) that also blocks
  dropping the `TEST_ADAPTER` vitest exclusion.
- **One combined RFC with 0008.** Rejected — different mechanisms, different
  risk; tracked as composing-but-separate.

## Rollout

1. **Phase 1 — collapse helpers.**
   [collapse-handler-txn-helper](stories/collapse-handler-txn-helper.md)
   (optional `fixtures`, delete `useHandlerTransactionalFixtures`).
2. **Phase 2 — migrate isolation.**
   [migrate-defineschema-pilot](stories/migrate-defineschema-pilot.md) →
   [migrate-defineschema-remaining](stories/migrate-defineschema-remaining.md).
3. **Phase 3 — retire `setupAdapterSuite`.**
   [retire-setup-adapter-suite](stories/retire-setup-adapter-suite.md)
   (route adapter-cluster tests through the handler connection).
4. **Config fidelity (parallel track).**
   [pg-prepared-statements-off-ci](stories/pg-prepared-statements-off-ci.md) →
   [test-db-hygiene-settings](stories/test-db-hygiene-settings.md).

## Open questions

1. **Is schema-rebuild or the global `resetTestAdapterState` beforeEach the
   dominant cost?** Profile a slow file both ways in the pilot before committing
   to the full 184-file migration — it decides whether the win is mechanical or
   marginal.
2. **Adapter-cluster routing.** Can every `adapters/**` test use the shared
   handler connection, or do some genuinely need a process-owned raw adapter
   (and therefore a thin successor to `setupAdapterSuite`)? Resolve in Phase 3
   scoping.

## Stories

| ID                                                                          | Title                                                                        | Status | Est LOC | Cluster               |
| --------------------------------------------------------------------------- | ---------------------------------------------------------------------------- | ------ | ------- | --------------------- |
| [collapse-handler-txn-helper](stories/collapse-handler-txn-helper.md)       | Make `fixtures` optional; delete `useHandlerTransactionalFixtures`           | ready  | 100     | test-isolation-helper |
| [migrate-defineschema-pilot](stories/migrate-defineschema-pilot.md)         | Migrate a pilot dir onto `useHandlerFixtures` + measure                      | ready  | 300     | test-isolation-helper |
| [migrate-defineschema-remaining](stories/migrate-defineschema-remaining.md) | Migrate remaining `defineSchema`-per-file tests (batched)                    | draft  | null    | test-isolation-helper |
| [retire-setup-adapter-suite](stories/retire-setup-adapter-suite.md)         | Route adapter-cluster tests through handler conn; delete `setupAdapterSuite` | draft  | 400     | test-isolation-helper |
| [pg-prepared-statements-off-ci](stories/pg-prepared-statements-off-ci.md)   | Add `prepared_statements: false` CI dimension (PG + MySQL toggle)            | ready  | 80      | test-config-fidelity  |
| [test-db-hygiene-settings](stories/test-db-hygiene-settings.md)             | Collation split, UTC pin, SQLite strict, PG min_messages                     | draft  | 120     | test-config-fidelity  |

## Changelog

- 2026-06-03: initial RFC, migrated from
  `trails/docs/activerecord/adapter-test-ci-coverage-plan.md` §9–§10.
