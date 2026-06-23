---
title: "TableDefinition#timestamps should default precision: 6 when adapter supports datetime-with-precision"
status: claimed
updated: 2026-06-23
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 25
priority: 40
pr: null
claim: "2026-06-23T01:55:16Z"
assignee: "timestamps-default-precision-6"
blocked-by: null
---

## Context

Rails `TableDefinition#timestamps`
(`activerecord/lib/active_record/connection_adapters/abstract/schema_definitions.rb:533-542`)
sets `options[:precision] = 6` when `precision` is unset and
`@conn.supports_datetime_with_precision?` is true, before routing both
`created_at`/`updated_at` through `column(..., :datetime, **options)`.

trails' `TableDefinition#timestamps`
(`packages/activerecord/src/connection-adapters/abstract/schema-definitions.ts:1044`)
only defaults `null`; it does NOT inject the default `precision: 6`. This is a
silent deviation surfaced while implementing the index-for-both-timestamps story
(PR #3547) — that PR was scoped to the index option only and did not touch
precision.

## Acceptance criteria

- `timestamps()` defaults `precision: 6` when precision is unset and the adapter
  reports datetime-with-precision support (mirror `supports_datetime_with_precision?`).
- Explicit `precision` passed by the caller is preserved.
- Adapters lacking the capability get no precision injected.
- Add/adjust a Rails-faithful test asserting the dumped/created column precision.
