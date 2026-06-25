---
title: "Converge JoinPart#table_name to a base_klass delegate"
status: in-progress
updated: 2026-06-25
rfc: "0027-join-dependency-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: 4110
claim: "2026-06-25T12:09:34Z"
assignee: "join-part-table-name-delegate-to-base-klass"
blocked-by: null
---

## Context

Rails' `JoinPart` delegates all four schema readers to `base_klass`:

    delegate :table_name, :column_names, :primary_key, :attribute_types, to: :base_klass

(`vendor/rails/activerecord/lib/active_record/associations/join_dependency/join_part.rb:20`)

PR #4045 (story `ar-associations-source-reflection`) converged
`column_names` / `primary_key` / `attribute_types` to faithful `base_klass`
delegates, but left `table_name` as the pre-existing writable instance field
(`packages/activerecord/src/associations/join-dependency/join-part.ts:20`,
`tableName = ""`). That field is NOT Rails' delegate semantics: it is a
mutable resolved/aliased-name carrier. `join-dependency.ts` assigns it the
through-chain / self-join alias name at three sites
(`treePart.tableName = targetTable` / `= entry.tableName`, lines ~369, ~1513,
~1537) and reads it back during join construction. In Rails `table_name`
always returns `base_klass.table_name`; the alias lives separately on the
Arel table (AliasTracker-assigned).

`JoinBase.tableName` stays `""` for the base node (join-base.ts never sets it),
which diverges from Rails' `base_klass.table_name`. No live bug today: the base
alias is read from `baseModel.tableName` directly (join-dependency.ts:151) and
`parent.baseKlass.tableName` (line ~751) reads off the model class, not the
field. trails already carries the faithful "resolved name" concepts in the
separate `tableAlias` and `effectiveSqlName` fields on `JoinPart`.

## Acceptance criteria

- `JoinPart.table_name` (`tableName`) returns `base_klass.table_name`,
  matching Rails' delegate — `JoinBase.table_name` no longer returns `""`.
- The writable resolved/aliased-name usage currently stored in the `tableName`
  field is moved to an appropriately-named field (e.g. reuse `effectiveSqlName`
  / `tableAlias`) and all ~20 `join-dependency.ts` read/write sites repointed.
- No regression in join-dependency / through-aliasing / self-join tests;
  api:compare for `join_part.rb` stays 100%.

## Notes

Surfaced by Codex review on PR #4045. Standalone refactor (field rename +
call-site repoint), deliberately deferred from the accessor-only story to keep
that PR scoped and behavior-safe.
