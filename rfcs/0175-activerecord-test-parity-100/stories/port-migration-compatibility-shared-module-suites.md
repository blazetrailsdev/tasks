---
title: "port-migration-compatibility-shared-module-suites"
status: closed
updated: 2026-10-01
rfc: "0175-activerecord-test-parity-100"
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
closed-reason: "Superseded by port-the-15-remaining-migration-compatibility-cases: trails#8342 ported the PostgreSQL cases and the LegacyPrimaryKey suite this story's text still lists as missing."
---

## Context

trails#8206 and the PR closing `port-remaining-migration-compatibility-test-cases` ported 31 of
the 57 cases of `vendor/rails/v8.0.2/activerecord/test/cases/migration/compatibility_test.rb`
into `packages/activerecord/src/migration/compatibility.test.ts` (the LOC ceiling stopped both).
`pnpm parity:test` lists 26 as missing:

- `CompatibilityTest`, adapter-gated or hook-dependent:
  - `legacy migrations raises exception when inherited` (`compatibility_test.rb:209-214`).
    Rails raises from `Migration.inherited` (`activerecord/lib/active_record/migration.rb:617-627`);
    trails has no port of that hook, and CLAUDE.md § "Module mixins" records that `inherited` has
    no JS equivalent, so decide the deferral before porting the case.
  - PostgreSQL: `legacy change column with null executes update` (`:277-294`),
    `disable extension on 7 0` and `legacy add foreign key with deferrable true` (`:614-651`).
  - MySQL: `change table collation not unset 7 0` (`:444-457`), `change column on 7 0` (`:653-665`).
- The shared-module suites: `NoOptionValidationTestCases` (`:679-709`),
  `DefaultPrecisionImplicitTestCases` / `DefaultPrecisionSixTestCases` (`:711-846`), run by
  `CompatibilityTest7_0` .. `CompatibilityTest4_2` (`:848-935`), and
  `LegacyPolymorphicReferenceIndexTestCases` (`:937-1062`).
- `LegacyPrimaryKeyTestCases` (`:1065-1260`): only
  `legacy primary key in create table should be integer` is ported, as the
  `legacyPrimaryKeyTestCases(migrationClass)` function run under
  `LegacyPrimaryKeyTest > V5_0` / `V4_2`. The other eight cases (`:1086-1244`) go in that function.

`CompatibilityTest`'s inline `TestModel` (`:12-14`) and the `LegacyPrimaryKey` model (`:1069-1070`)
are already declared in the test file.

Already filed separately: `add reference on 6 0`
(`anonymous-migration-class-name-is-empty-string-not-nil`) and
`legacy migrations not raise exception on reverting transaction`
(`migration-lacks-transaction-and-execute-forwarders`).

## Acceptance criteria

- [ ] Port the remaining cases under Rails' names and describe paths, with Rails'
      assertion kinds and `itIfSupports` / `currentAdapter` gates.
- [ ] Converge any `Compatibility::V*` behavior a ported case shows diverging; don't skip it.
- [ ] `pnpm parity:test` reports `migration/compatibility_test.rb` with no missing case other than
      one parked under a `PERMANENT-SKIP:` line citing the CLAUDE.md section that rules it out.
