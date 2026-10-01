---
title: "Port the 15 remaining migration compatibility cases (shared-module suites, MySQL arms, inherited)"
status: draft
updated: 2026-10-01
rfc: "0175-activerecord-test-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 450
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

trails#8342 brought `packages/activerecord/src/migration/compatibility.test.ts` to 42 of the 57
cases of `vendor/rails/v8.0.2/activerecord/test/cases/migration/compatibility_test.rb`. This story
supersedes `port-migration-compatibility-shared-module-suites`, whose text was written before the
PostgreSQL cases and the `LegacyPrimaryKeyTestCases` module landed. `pnpm parity:test` lists
exactly these 15 as missing:

- `CompatibilityTest`:
  - `legacy migrations raises exception when inherited` (`compatibility_test.rb:209-214`). Rails
    raises from `Migration.inherited` (`activerecord/lib/active_record/migration.rb:617-627`);
    trails has no port of that hook, and CLAUDE.md § "Module mixins" records that `inherited` has
    no JS equivalent, so decide the deferral before porting the case.
  - `legacy migrations not raise exception on reverting transaction` (`:216-228`), which needs
    `migration-lacks-transaction-and-execute-forwarders`.
  - MySQL: `change table collation not unset 7 0` (`:444-457`) and `change column on 7 0`
    (`:653-665`, also needs the `execute` forwarder).
- `NoOptionValidationTestCases` (`:679-709`): `options are not validated`.
- `DefaultPrecisionImplicitTestCases` (`:711-782`) and `DefaultPrecisionSixTestCases`
  (`:784-846`): three cases each, run by `CompatibilityTest7_0` .. `CompatibilityTest4_2`
  (`:848-935`), each of which sets `migration_class`.
- `LegacyPolymorphicReferenceIndexTestCases` (`:937-1062`): four cases.

Shape to follow, already in the TS file: a shared module is a function taking the migration class
(`legacyPrimaryKeyTestCases(migrationClass)`), called under one `describe` per including class.
Run the file on PostgreSQL and MySQL as well as SQLite: the dump assertions match trails' TS dump
syntax, and the gate check (`pnpm exec tsx scripts/test-compare/compare.ts --gates --check`) is
hard-zero.

## Acceptance criteria

- [ ] Port the 15 cases under Rails' names and describe paths, with Rails' assertion kinds and
      `it.skipIf(currentAdapter(...))` / `itIfSupports` gates.
- [ ] Converge any `Compatibility::V*` behavior a ported case shows diverging; don't skip it.
- [ ] `pnpm parity:test` reports `migration/compatibility_test.rb` with no missing case other than
      one parked under a `PERMANENT-SKIP:` line citing the CLAUDE.md section that rules it out.
