---
rfc: "0064-ar-test-infra-layout-fidelity"
title: "AR test-infra layout fidelity"
status: active
created: 2026-07-08
updated: 2026-07-28
owner: "@your-handle"
packages: ["activerecord"]
clusters: []
priority: 2
---

## Problem

Rails' AR test infra lives in two named trees:
`vendor/rails/activerecord/test/cases/helper.rb` (suite-wide setup) and
`vendor/rails/activerecord/test/support/` (ten helpers: `config.rb`,
`connection.rb`, `connection_helper.rb`, `load_schema_helper.rb`,
`adapter_helper.rb`, `async_helper.rb`, `ddl_helper.rb`,
`schema_dumping_helper.rb`, `fake_adapter.rb`, `tools.rb`).

trails calls the same things `test-setup-*.ts` and `test-helpers/` — invented
names. Fidelity of file, method, and variable names to Rails is this project's
primary goal, so the invented names are the deviation to close.

Two trails files are **already** exact kebab renderings of their Rails
counterparts — `test-helpers/connection-helper.ts` and
`test-helpers/schema-dumping-helper.ts` — so the mirroring has started; only the
directory name and the remaining filenames are wrong.

### Spike outcome (2026-07-26)

The spike `spike-align-test-setup-with-cases-helper` first recommended keeping
`test-setup-*`. That was reversed. It was wrong on a fact — it compared only
against `cases/helper.rb` and concluded our files had "no Rails counterpart",
missing `test/support/`'s ten named files — and wrong on weighting: three of its
five arguments were rename cost, internal naming convention, and "the compare
tooling doesn't map these files", none of which outrank fidelity.

What survives: the vitest boot order is real, so the setup files cannot collapse
into one. But Rails' test infra is not one file either — it is `cases/helper.rb`
plus ten `support/*.rb`. Multiple files is the faithful shape; only our names
and directories are invented.

## Target layout

```text
packages/activerecord/src/
  cases/
    helper.ts               <- test/cases/helper.rb
  support/
    config.ts               <- test/support/config.rb (+ test/config.rb)
    connection.ts           <- test/support/connection.rb
    connection-helper.ts    <- test/support/connection_helper.rb     [matches]
    schema-dumping-helper.ts<- test/support/schema_dumping_helper.rb [matches]
    load-schema-helper.ts   <- test/support/load_schema_helper.rb
    adapter-helper.ts       <- test/support/adapter_helper.rb
    async-helper.ts         <- test/support/async_helper.rb
    ddl-helper.ts           <- test/support/ddl_helper.rb
    fake-adapter.ts         <- test/support/fake_adapter.rb
  test-setup-worker-db.ts   (no Rails counterpart - vitest forks; Rails doesn't)
  test-helpers/
    models/ fixtures/ migrations/ assets/ test-schema.ts   (mirror test/ root)
```

## Disposition of every current `test-helpers/` entry

`test-helpers/` is a mashup of two Rails trees: part mirrors `test/support/*.rb`,
part mirrors the **`test/` root** (`assets/`, `fixtures/`, `migrations/`,
`models/`, `schema/`). It is **partially drained, not renamed** — the directory
survives.

**A. Mirrors the Rails `test/` root — stays put** (already faithful;
`schema:compare` / `fixtures:compare` key off these paths):
`models/`, `fixtures/`, `migrations/`, `assets/`, `test-schema.ts`
(<- `test/schema/schema.rb`).

**B. Moves to `support/` with a Rails name** (moved under current name by story
1; renamed by stories 3-5): `connection-helper.ts`, `schema-dumping-helper.ts`,
`test-connection-env.ts`, `test-database-config.ts`, `arunit2-config.ts`,
`supports.ts`, `canonical-schema.ts`, `schema-file-generator.ts`,
`second-connection.ts`, `setup-second-pool.ts`, `setup-handler-suite.ts`.

**C. Moves to `support/`, keeps its invented name** — vitest-fork-model or
trails-harness infrastructure with no Rails counterpart, but still test support:
`ar-db-slots.ts`, `ar-db-forks-default.ts`, `sqlite-template.ts`,
`template-global-setup.ts`, `skip-global-reset.ts`, `ddl-profile.ts`,
`canonical-model-index.ts`, `canonical-model-index-encryption-setup.ts`,
`quote-regex.ts`, `with-db-warnings-action.ts`, `setup-adapter-suite.ts`,
`drop-all-tables.ts`, `seed-association-cache.ts`, `schema-types.ts`.

**D. Destination unresolved — story `disposition-remaining-test-helpers`
decides.** Suspected library code misfiled into test infra, or mapping somewhere
other than `support/`; each needs its Rails counterpart confirmed before moving:
`fixtures.ts`, `fixture-set.ts`, `define-fixtures.ts`, `fixtures-registry.ts`,
`use-fixtures.ts`, `with-transactional-fixtures.ts`, `use-transactional-tests.ts`
(Rails' equivalents are `lib/active_record/fixtures.rb`,
`lib/active_record/fixture_set/`, `lib/active_record/test_fixtures.rb` — **lib**,
not test support; trails already has a top-level `src/test-fixtures.ts`);
`in-time-zone.ts` (Rails' `InTimeZone` is a module _inside_ `cases/helper.rb:66-79`,
so it may belong in `cases/helper.ts`); `protected-params.ts`;
`repair-validations.ts`; `rocket-tables.ts` (its docstring notes
`ActiveRecord::Migration::ForeignKeyTest` creates and drops `rockets` /
`astronauts` **inline**, `foreign_key_test.rb:178-194`, so the faithful home is
the test file that uses it, not a shared helper).

**E. Not `test-helpers/` entries at all — stay next to their subject.** These
four were flagged as unbucketed by the #5361 re-scan; the 2026-07-28 re-scan
confirms each already sits with its subject, and each stays there:

- `src/pooled-test-adapter.test.ts` — its subject is `src/test-adapter.ts`, a
  top-level module, not a `test-helpers/` one. Rails has no `test_adapter.rb`:
  the nearest counterparts are `test/support/connection.rb`'s
  `establish_connection` and the pin/unpin pair at
  `lib/active_record/test_fixtures.rb:176-210`. Under the repo's
  test-next-to-source convention (CLAUDE.md), `src/` is already its correct
  home.
- `src/naked-fixtures.test.ts` — exercises the bucket-D fixtures machinery
  (`test-helpers/fixtures.ts`, `src/fixtures.ts`) and mirrors
  `test/cases/fixtures_test.rb`'s naked/yml cases. Rails puts it in
  `test/cases/`; trails puts tests next to source, so it stays in `src/`
  regardless of where bucket D lands its subjects.
- `src/test-fixtures/fixture-connection.ts` + `.test.ts` — postdates the
  snapshot. Its Rails counterpart is `lib/active_record/test_fixtures.rb:176-210`
  (`@fixture_connection_pools`, `pool.lease_connection`, `unpin_connection!`) —
  **lib**, not test support, which is exactly the bucket-D reasoning — so it
  rides with the rest of the fixture family in `src/test-fixtures/`, not
  `support/`.

**Staleness warning.** This table is a snapshot, re-scanned against `main` on
2026-07-28 (originally 2026-07-26), and `main` drifts — `rocket-tables.ts`
landed after the spike branch was cut and had to be added late, and
`fixture-connection.ts` landed mid-#5361. **Whichever story executes next must
re-scan `test-helpers/` against current `main`** and bucket anything new rather
than trusting this list. As of the 2026-07-28 re-scan, `test-helpers/` holds
only bucket A (`assets/`, `fixtures/`, `migrations/`, `models/`,
`test-schema.ts`) plus the bucket-D leftovers `fixtures.ts` and
`fixtures-registry.ts`; buckets B and C have shipped to `support/`, and bucket
D's non-`test-helpers/` members landed in `src/test-fixtures/` via #5403.

## What does NOT move

- **`test-setup-worker-db.ts` and the template `globalSetup`.** Per-worker DB
  isolation via advisory locks exists because vitest forks; Rails' suite is one
  process against one database. No Rails name to adopt.
- **Bucket A.** Already faithful to `test/models/`, `test/fixtures/`,
  `test/migrations/`, `test/assets/`, `test/schema/schema.rb`, and already the
  keys `schema:compare` / `fixtures:compare` read.
- **Test files themselves.** Rails puts tests in `test/cases/*_test.rb`; trails
  puts `*.test.ts` next to source by repo convention (CLAUDE.md). Settled,
  separate divergence — hence `cases/` holds only `helper.ts`.

## Known traps for implementers

- `eslint/no-raw-sql.mjs:42` hardcodes `/(^|\/)test-setup-[^/]*\.ts$/`; a
  `cases/helper.ts` path stops matching it and would start failing `no-raw-sql`.
- `eslint.config.mjs` ignores `packages/activerecord/src/test-helpers/**` in
  several rules; `eslint/no-explicit-any-src-exclude.json` and
  `eslint/rails-error-parity-exclude.json` hold per-file paths.
- `scripts/*-compare/` constants point at `test-helpers/models`,
  `test-helpers/fixtures`, `test-helpers/test-schema.ts` — these feed the stats
  DB, so `schema:compare` / `fixtures:compare` output must be byte-identical
  across the rename.
- Ordering: ship one story at a time from `main`, no stacking.

## Non-goals

- Not a behavior change to the harness. Suite-wide `helper.rb` _settings_ that
  trails never applies are RFC 0071's scope, and `helper.rb:27` specifically is
  RFC 0073's.
- Not a relitigation of `*.test.ts`-next-to-source.
