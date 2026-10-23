---
title: "Relation#distinct accepts any truthy value, as distinct(:queue_name) passes"
status: draft
updated: 2026-10-23
rfc: "0189-activerecord-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rails' `QueryMethods#distinct(value = true)` / `distinct!(value = true)`
(`vendor/rails/v8.0.2/activerecord/lib/active_record/relation/query_methods.rb`)
store any value in `distinct_value`. A caller can pass a truthy Symbol:
`relation.distinct(:queue_name)` (`vendor/solid_queue/v1.1.3/app/models/solid_queue/queue_selector.rb:46,56`).
trails types it `distinct(value?: boolean)` (`packages/activerecord/src/relation.ts:1969`,
`relation/query-methods.ts:987-993`, `distinctValue: boolean | null`), so
`packages/solid-queue/src/queue-selector.ts:63,80` calls `distinct()`. Two `kind: "args"` rows are
baselined in `scripts/api-compare/call-mismatches-exclude/solid-queue/queue-selector.json` (trails#9280).

## Acceptance criteria

- `distinct` / `distinctBang` take `value: unknown = true`, and `distinctValue` is `unknown`.
  Readers test it with Ruby truthiness (`rtest`), as `finder-methods.ts:463` already does.
- `queue-selector.ts` passes `"queue_name"` as Rails does.
- Both baseline rows are deleted, and `queue-selector.json` with them.
