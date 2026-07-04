---
title: "Migrator.validate should tolerate nil version before the name-dup check (Rails parity)"
status: claimed
updated: 2026-07-04
rfc: "0051-migration-schema-statements-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: "2026-07-04T20:47:07Z"
assignee: "migrator-validate-nil-version-name-dup"
blocked-by: null
---

## Context

Surfaced while porting `migrator.test.ts` to a faithful mirror of
`vendor/rails/activerecord/test/cases/migrator_test.rb` (PR #4351,
RFC 0048 converge-migrator-one-schema).

Rails' `Migrator#validate` (vendor/rails/activerecord/lib/active_record/migration.rb)
checks duplicate **versions** then duplicate **names** independently, and
tolerates a `nil` version — `Sensor.new(nil, version)` and bare
`Migration.new("Chunky")` (no version) are valid inputs. `test_migrator_with_duplicate_names`
passes two `Migration.new("Chunky")` instances, both with **nil version**, and
expects a `DuplicateMigrationNameError` ("Multiple migrations have the name Chunky").

trails' `Migrator.validate` (packages/activerecord/src/migration.ts ~3200) rejects a
missing/non-numeric `version` _first_ (`Invalid migration version: ...`), before
reaching the name-dup check, because `MigrationProxy.version` is a required
numeric string. So a list of two nil-version, same-name migrations throws the
wrong error in trails. The port worked around this by giving the two migrations
distinct numeric versions (1, 2) — the dup-name path still fires, but the nil-version
faithful input could not be used.

## Acceptance criteria

- [ ] `Migrator.validate` tolerates a nil/absent version (or equivalent) and still
      raises `DuplicateMigrationNameError` for same-name migrations, matching Rails'
      version-then-name independent checks.
- [ ] `migrator.test.ts` "migrator with duplicate names" can be restored to the
      Rails-faithful nil-version inputs (`migration("Chunky")` without a version).
- [ ] No regression in the existing numeric-version validation paths.
