---
title: "activerecord-port-fixtures-test-remaining-excluded-cases"
status: draft
updated: 2026-11-10
rfc: "0123-blocked-convergence-holding"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`activerecord-port-fixtures-test-excluded-cases-files-and-paths` ported the fixture-file
and fixture-path cases of `vendor/rails/v8.0.2/activerecord/test/cases/fixtures_test.rb`.
These exclusions are still in `scripts/parity/unported-files/unscoped.ts`, each needing
library work rather than a test port:

- `FixturesTest` "omap fixtures" (`fixtures_test.rb:571-580`): `categories_ordered.yml`
  opens with a local `!omap` tag. `ActiveSupport::ConfigurationFile#parse`
  (`vendor/rails/v8.0.2/activesupport/lib/active_support/configuration_file.rb:21-36`)
  is `YAML.unsafe_load(_file)`, whose ToRuby visitor resolves `!omap`
  (`vendor/ruby/v3.3.11/ext/psych/lib/psych/visitors/to_ruby.rb:292`). trails'
  `packages/activesupport/lib/configuration-file.ts:42-46` calls the raw
  `psych-adapter` `parse` instead, so the tag is left unresolved. Converge `parse` onto
  `Psych.unsafeLoad` / `unsafeLoadFile`, then mirror `categories_ordered.yml` into
  `packages/activerecord/src/fixture-set/test-data/` (TSE loop) and port the test.
- `InvalidTableNameFixturesTest` "raises error" (`fixtures_test.rb:1174-1184`):
  `FixtureClassNotFound` exists (`packages/activerecord/src/fixtures.ts:36`) and
  `Fixture#find` raises it, but `fixtures-registry.ts` binds `funnyJokes` to `Joke`, so
  `fixtures(["funnyJokes"])` never leaves the class unresolved. The set's class should
  come from `set_fixture_class` / naming, as `FixtureSet#model_class=` does.
- `MultipleFixtureConnectionsTest` (5 tests, `fixtures_test.rb:1646+`):
  `setup_shared_connection_pool` / `teardown_shared_connection_pool` /
  `clean_up_connection_handler` are unported in `test-fixtures.ts`.
- `TransactionalFixturesOnConnectionNotification` (3 tests, `:1085-1177`),
  `FixturesBrokenRollbackTest` (`:1206-1234`): callable `setup_fixtures` /
  `teardown_fixtures` / overridable `load_fixtures`, and `pin_connection!(lock_threads)`.
- "bulk insert with multi statements disabled/enabled" (`:156-251`): Mysql2Adapter
  always connects with `multipleStatements: true`.
- `SameNameDifferentDatabaseFixturesTest` "fixtures are properly loaded": sets on
  different databases load through one connection.

## Acceptance criteria

- [ ] Each case above is ported with Rails' test name and assertions, after the library
      change it needs; its `unscoped.ts` entry is deleted.
- [ ] `pnpm parity:test:assertions` stays green.
