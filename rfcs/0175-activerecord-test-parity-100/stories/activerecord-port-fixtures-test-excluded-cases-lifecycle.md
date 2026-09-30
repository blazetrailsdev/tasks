---
title: "activerecord: port the 16 fixtures_test.rb exclusions about fixture lifecycle and accessors"
status: ready
updated: 2026-09-30
rfc: "0175-activerecord-test-parity-100"
cluster: unported-tests
packages: ["activerecord"]
deps:
  [
    "activerecord-test-fixtures-method-missing-accessors",
    "port-test-fixtures-class-attribute-declarations",
  ]
deps-rfc: []
est-loc: 500
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

The other half of `fixtures_test.rb`'s exclusions — setup/teardown against a pool, instantiated-fixture
ivars, anonymous `Class.new(ActiveRecord::TestCase)`, cache resets, `FixtureClassNotFound`:

- `fixtures_test.rb` — "all there"
  reason: fixtures :all scans fixture_paths on disk and asserts the .yml layout under test/fixtures/all (fixtures_test.rb:1237-1247). trails has no fixture_paths and no fixtures :all; the corpus is TS modules, as in the YAML-path
- `fixtures_test.rb` — "all there"
  reason: Same as LoadAllFixturesTest (fixtures_test.rb:1250-1260), with two fixture_paths.
- `fixtures_test.rb` — "all there"
  reason: Same as LoadAllFixturesTest (fixtures_test.rb:1263-1273), with a Pathname.
- `fixtures_test.rb` — "cache"
  reason: Asserts FixtureSet.fixture_is_cached? and setup_fixture_accessors (fixtures_test.rb:1276-1297). trails' fixtures() reloads every set per test and keeps no connection-keyed fixture cache, so there is nothing cached to ass
- `fixtures_test.rb` — "complete instantiation"; "fixtures from root yml with instantiation"
  reason: Both read an ivar that use_instantiated_fixtures = true assigns per fixture row — @first.title, @unknown.credit_limit (fixtures_test.rb:43,511,515). trails never instantiates ivars: useFixtures (test-fixtures.ts:189-206)
- `fixtures_test.rb` — "fixtures from root yml without instantiation"; "visibility of accessor method"; "without complete instantiation"
  reason: The mirror image of the row above: these assert the ABSENCE of those ivars under use_instantiated_fixtures = false, and that the accessor is private — defined?(@first), respond_to?(:topics, false) (fixtures_test.rb:756-7
- `fixtures_test.rb` — "without instance instantiation"
  reason: Asserts defined?(@first) is false under use_instantiated_fixtures = :no_instances (fixtures_test.rb:796-803) — the third value of a flag trails does not have. Same missing surface as the two rows above.
- `fixtures_test.rb` — "fixture method and private alias"; "fixture method does not clash with a test case method"; "fixtures are set up with database env variable"
  reason: Each builds an anonymous Class.new(ActiveRecord::TestCase), declares fixtures inside it, and calls test_case.new(:test_fixtures).run to assert the result passed (fixtures_test.rb:604-646). Minitest's runnable-per-instanc
- `fixtures_test.rb` — "create fixtures resets sequences when not cached"
  reason: Reads create_fixtures(table_name).first.fixtures after FixtureSet.reset_cache (fixtures_test.rb:713-716,740-745); trails' FixtureSet has no instance form, fixture-set cache or reset_cache. CONVERGEABLE fixture-set-instan
- `fixture_set/file_test.rb` — "render context lookup scope"
  reason: Asserts Ruby constant-lookup scope inside the rendering context — `defined? ActiveRecord`, `defined? ActiveRecord::FixtureSet::File`, `File.name` (file_test.rb:97-116). Constants are resolved lexically against the enclos
- `test_fixtures_test.rb` — "doesnt rely on active support test case specific methods"
  reason: Builds a `Class.new(Minitest::Test)` at run time, points its fixture_paths at a tmpdir holding a zines.yml, and runs it through Minitest's own runner, asserting the result passed? (test_fixtures_test.rb:33-72). Vitest ha

The instantiated-fixture cases read `@first` ivars Rails assigns per row; trails' carrier is the fixture
accessor / instance property, decided by `activerecord-test-fixtures-method-missing-accessors` (RFC 0174).

## Acceptance criteria

- [ ] Each case ported with Rails' body over the ported `TestFixtures` API; entries deleted.

## Verification

```bash
pnpm parity:test --package activerecord --missing && pnpm vitest run scripts/parity/unported-files.test.ts scripts/parity/unported-live-test.test.ts
```
