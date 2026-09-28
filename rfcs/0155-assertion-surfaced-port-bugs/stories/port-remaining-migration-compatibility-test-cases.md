---
title: "port-remaining-migration-compatibility-test-cases"
status: draft
updated: 2026-09-28
rfc: "0155-assertion-surfaced-port-bugs"
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

trails#8206 lifted the won't-do exclusion of
`vendor/rails/v8.0.2/activerecord/test/cases/migration/compatibility_test.rb` and ported 17 of
its 57 cases into `packages/activerecord/src/migration/compatibility.test.ts`
(the LOC ceiling stopped it there). `parity:test` now lists the rest as missing:

- `CompatibilityTest` cases at `compatibility_test.rb:164-208` (5.2 precision on
  change_table / add_timestamps, which need a `Time.now` default), `:209-214`
  (`legacy migrations raises exception when inherited`), `:231-257` (comment
  revert, `supports_comments?`), `:278-294` (PG `legacy change column with null
executes update`), `:313-335` (datetime precision on add_column 5.0 / 6.1),
  `:423-457` (rename_table too-long index name, MySQL collation), `:489-548`
  (create/rename table on 7.0), `:571-613` (change_column_null boolean arms),
  `:615-676` (PG disable_extension / deferrable FK, MySQL change_column).
- The shared-module suites: `NoOptionValidationTestCases` (`:679-709`),
  `DefaultPrecisionImplicitTestCases` / `DefaultPrecisionSixTestCases`
  (`:711-846`) run by `CompatibilityTest7_0`..`4_2` (`:848-935`),
  `LegacyPolymorphicReferenceIndexTestCases` (`:937-1062`) and
  `LegacyPrimaryKeyTestCases` (`:1065-1285`). The TS-only
  `legacy primary key is integer` in `compatibility.trails.test.ts` is superseded by
  `legacy primary key in create table should be integer`.

Already filed separately: `add reference on 6 0`
(`anonymous-migration-class-name-is-empty-string-not-nil`) and
`legacy migrations not raise exception on reverting transaction`
(`migration-lacks-transaction-and-execute-forwarders`).

## Acceptance criteria

- [ ] Port the remaining cases under Rails' names and describe paths, with Rails'
      assertion kinds and `itIfSupports` / `currentAdapter` gates.
- [ ] Converge any `Compatibility::V*` behavior a ported case shows diverging; don't skip it.
- [ ] Retire `legacy primary key is integer` from `compatibility.trails.test.ts` once its Rails twin is ported.
