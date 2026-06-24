---
title: "Port default_column_serializer class config + serialize fallback"
status: claimed
updated: 2026-06-24
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: "2026-06-24T19:02:41Z"
assignee: "default-column-serializer-config-accessor"
blocked-by: null
---

## Context

`default_column_serializer` is a Rails `class_attribute`
(`instance_accessor: false`, default `Coders::YAMLColumn`) used as the
configurable fallback coder when `serialize` is called without an explicit
coder: `vendor/rails/activerecord/lib/active_record/attribute_methods/serialization.rb:19-20`
and `serialization.rb:183-184` (`coder ||= default_column_serializer`).

trails diverges: the default serializer path is hardcoded in `resolveSerializer`
(`packages/activerecord/src/serialize.ts:64-74`) / `buildColumnSerializer`, so
callers cannot override the class-level default. PR #4048 skipped
`default_column_serializer`/`=`/`?` with a justification in
`scripts/api-compare/conventions.ts` (tracked-pending-convergence).

## Acceptance criteria

- Add a `default_column_serializer` class config accessor (reader + `=` writer,
  default YAMLColumn) realized as trails state.
- `serialize` / `buildColumnSerializer` fall back to the configured
  `defaultColumnSerializer` instead of a hardcoded path, matching
  `serialization.rb:183-184`.
- A test sets `Model.defaultColumnSerializer = <coder>` and verifies the
  fallback is used.
- Remove `default_column_serializer`/`=`/`?` from the SKIP_GROUPS entry;
  attribute-methods/serialization.ts stays at 100%.
