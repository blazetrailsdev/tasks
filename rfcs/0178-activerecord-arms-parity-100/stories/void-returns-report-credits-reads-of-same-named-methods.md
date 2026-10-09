---
title: "api-compare: the void-returns report credits a read to every same-named method"
status: in-progress
updated: 2026-10-09
rfc: "0178-activerecord-arms-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: trails#8732
claim: "2026-10-09T22:09:41Z"
assignee: "preserve-original-encrypted-skips-its-column-check-on-a-cold-schema-cache"
blocked-by: null
closed-reason: null
---

## Context

`pnpm parity:api:returns` keys Rails' return-value reads by method NAME within a package
(`scripts/api-compare/extract-return-uses.rb`, `walk` / `value_reads`; `report-void-returns.ts#voidReturnRows`).
A read of one class's method therefore counts against every same-named method in the package.

trails#8419 met three such rows whose Rails method returns nil and has no reader of its own:

- `Migrator#validate` (`vendor/rails/v8.0.2/activerecord/lib/active_record/migration.rb:1557-1563`). Its one
  "read" is `FixtureSet::File#raw_rows` calling that file's own private `validate`
  (`fixture_set/file.rb:55`).
- `SchemaDumper#foreign_keys` (`schema_dumper.rb:316-346`), credited with 88 reads of
  `connection.foreign_keys(table)` (first: `connection_adapters/abstract/schema_creation.rb:58`).
- `DatabaseTasks.migrate` (`tasks/database_tasks.rb:262-283`), which ends in `schema_cache.clear!` (nil).

The PR typed those three ports `undefined` so the rows left the report. The report itself still credits
homonym reads, in every package (34 non-activerecord rows remained on 2026-10-02).

## Acceptance criteria

- [ ] A receiverless read (`:fcall` / `:vcall` / `:command`) in a file that defines a method of that name
      is attributed to that file's definition only, not to same-named methods in other files.
- [ ] A read through an explicit receiver is not attributed to a method Rails declares private.
- [ ] Unit tests in `scripts/api-compare/report-void-returns.test.ts` cover both rules.
- [ ] The PR body records the report's row count per package before and after.
