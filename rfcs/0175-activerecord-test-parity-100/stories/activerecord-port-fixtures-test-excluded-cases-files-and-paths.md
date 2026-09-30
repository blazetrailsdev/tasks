---
title: "activerecord: port the 28 fixtures_test.rb exclusions about fixture files and paths"
status: ready
updated: 2026-09-30
rfc: "0175-activerecord-test-parity-100"
cluster: unported-tests
packages: ["activerecord"]
deps:
  [
    "parity-100-rehome-postponed-rfc-dependencies",
    "activerecord-unexclude-and-measure-fixtures-rb",
    "psych-load-file-family",
    "port-fixtures-test-rb-fixture-declarations",
  ]
deps-rfc: []
est-loc: 550
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`fixtures_test.rb` carries the largest block of per-test exclusions. This half is about fixture _files_:
loading `.yml` from `fixture_paths`, `fixtures :all` directory scans, `create_fixtures(dir, name)`:

- `fixtures_test.rb` — "bulk insert with multi statements disabled"; "bulk insert with multi statements enabled"
  reason: Reconnect with flags MULTI_STATEMENTS / [] and assert a two-statement execute succeeds / raises (fixtures_test.rb:156-251). trails' Mysql2Adapter always opens the driver with multipleStatements: true, so there is no disa
- `fixtures_test.rb` — "broken yaml exception"; "clean fixtures"; "create fixtures"; "create symbol fixtures"; "dirty dirty yaml file"; "inserts with pre and suffix"; "multiple clean fixtures"; "nonexistent fixture file" …
  reason: Each loads fixtures from a .yml path on disk — FixtureSet.create_fixtures(dir, name) or FixtureSet.new(nil, name, Klass, FIXTURES_ROOT + ...) — and asserts on the parse or the layout: a Psych omap, a Tempfile of malforme
- `fixtures_test.rb` — "raises an error when all fixtures loaded"
  reason: Asserts `fixtures :all` with fixture_paths = nil raises 'No fixture path found.' (fixtures_test.rb:1607-1619). trails' fixtures() takes the set names or data up front and has no :all arm that globs fixture_paths, so ther
- `fixtures_test.rb` — "ignores file fixtures"
  reason: Points fixture_paths at FIXTURES_ROOT/all and calls `fixtures :all`, asserting the .yml files found on disk (fixtures_test.rb:1627-1632). The canonical corpus is TS modules, and fixtures() has no :all arm that scans a di
- `fixtures_test.rb` — "uses writing connection for fixtures"; "writing and reading connections are the same"; "writing and reading connections are the same for non default shards"; "only existing connections are replaced"; "only existing connections are restored"
  reason: Rails defines these only under current_adapter?(:SQLite3Adapter) && !in_memory_db? (fixtures_test.rb:1646) against test/fixtures/fixture_database.sqlite3, and drives TestFixtures#setup_shared_connection_pool / teardown_s
- `fixtures_test.rb` — "fixtures are properly loaded"
  reason: Loads dogs and other_dogs, both table "dogs", where OtherDog < ARUnit2Model lives on the arunit2 database (models/other_dog.rb). trails' fixtures() loads every set through one connection, so the two sets land in one dogs
- `fixtures_test.rb` — "model class in fixture file is respected"
  reason: Calls create_fixtures("other_posts") by set name and #find on the returned Fixture (fixtures_test.rb:1002-1008). trails' FixtureSet.createFixtures (fixtures.ts:936) takes a model and a data hash, not a name resolved agai
- `fixtures_test.rb` — "notification established transactions are rolled back"; "transaction created on connection notification"; "transaction created on connection notification for shard"
  reason: Each drives setup_fixtures/teardown_fixtures as instance methods against a mock pool and asserts pin_connection!(true) (fixtures_test.rb:1085-1177). trails' transactional fixtures are vitest hooks (with-transactional-fix
- `fixtures_test.rb` — "raises error"
  reason: Asserts ActiveRecord::FixtureClassNotFound when a set has no resolvable class (fixtures_test.rb:1180-1184). trails has no FixtureClassNotFound: the registry binds every set name to a model, so there is no unresolved clas
- `fixtures_test.rb` — "no rollback in teardown unless transaction active"
  reason: Aliases setup_fixtures/teardown_fixtures and overrides load_fixtures to raise (fixtures_test.rb:1206-1234). trails' fixture lifecycle is vitest hooks registered by fixtures(), with no overridable load_fixtures or callabl

trails' canonical fixtures are TS modules (`packages/activerecord/src/test-helpers/fixtures/`), but the
Rails API under test is the YAML loader — which RFC 0170 (Psych) makes portable. `fixtures.rb` becomes
measured under `activerecord-unexclude-and-measure-fixtures-rb` (RFC 0174).

## Acceptance criteria

- [ ] `FixtureSet.create_fixtures` and `fixtures :all` load `.yml` files from `fixture_paths` as Rails does, the Rails `test/fixtures/**/*.yml` inputs are vendored or mirrored for these cases, and each case is ported; entries deleted.

## Verification

```bash
pnpm parity:test --package activerecord --missing && pnpm vitest run scripts/parity/unported-files.test.ts scripts/parity/unported-live-test.test.ts
```
