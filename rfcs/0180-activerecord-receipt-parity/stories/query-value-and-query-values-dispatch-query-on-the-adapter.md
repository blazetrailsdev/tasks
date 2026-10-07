---
title: "activerecord: query_value and query_values dispatch query on the adapter"
status: draft
updated: 2026-10-07
rfc: "0180-activerecord-receipt-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`vendor/rails/v8.0.2/activerecord/lib/active_record/connection_adapters/abstract/database_statements.rb:105-115`:

```ruby
def query_value(...)  = single_value_from_rows(query(...))
def query_values(...) = query(...).map(&:first)
def query(...)        = internal_exec_query(...).rows
```

`query_value` and `query_values` dispatch `query` on `self`, so PostgreSQL's override
(`postgresql/database_statements.rb:14-17`, `internal_execute` then
`result.map_types!(@type_map_for_results).values`, ported in trails#8652) is what they call.

`packages/activerecord/src/connection-adapters/abstract/database-statements.ts` (`queryValue`,
`queryValues`, around line 290-303) call the module-level `query.call(this, ...)` instead of
`this.query(...)`, so on PostgreSQL they bypass the override and its result type map: a bytea column
read through `queryValue` comes back as escaped text where Rails decodes it.

## Acceptance criteria

- [ ] `queryValue` and `queryValues` call `this.query(...)`.
- [ ] A live-PG test reads a bytea value through `queryValue` and gets the decoded bytes.
