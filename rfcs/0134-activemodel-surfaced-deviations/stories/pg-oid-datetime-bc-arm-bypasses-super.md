---
title: "PG OID::DateTime's BC arm parses wire format instead of rewriting the year and calling super"
status: draft
updated: 2026-09-06
rfc: "0134-activemodel-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 90
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rails' PG `OID::DateTime#cast_value` handles a BC-era timestamp by rewriting
the year in the string and handing it to `super`
(`activerecord/lib/active_record/connection_adapters/postgresql/oid/date_time.rb:8-18`):

```ruby
when / BC$/
  value = value.sub(/^\d+/) { |year| format("%04d", -year.to_i + 1) }
  super(value.delete_suffix!(" BC"))
```

so the BC case reuses the whole `Type::DateTime` string path.

trails instead parses BC strings through a separate wire-format route
(`packages/activerecord/src/connection-adapters/postgresql/oid/date-time.ts:20-40`):
it sniffs for a trailing offset, calls `parsePostgresInstant` or
`parsePostgresTimestampAsInstant`, and lifts the result. It carries a
`@missingRailsCall format — PERMANENT` receipt for the missing `format` call.

The receipt was arguably fair while `cast_value` answered a `Temporal.Instant`
and `super` could not produce a proleptic year. PR #7537 removed that
constraint: the seam now answers a Ruby `::Time`, and `Time.utc` takes a
negative year directly, so the Rails shape — rewrite the year, delete the
suffix, call `super` — is reachable. The receipt should not outlive the reason
for it.

## Converged shape

`castValue`'s `/ BC$/` arm is the Rails three lines: `sub(/^\d+/)` with
`format("%04d", -year.to_i + 1)`, `delete_suffix(" BC")`, then `super(value)`.
`parsePostgresInstant` / `parsePostgresTimestampAsInstant` drop out of this
file, the `hasOffset` sniff goes with them, and the
`@missingRailsCall format — PERMANENT` receipt is deleted rather than
re-justified.

## Acceptance criteria

- [ ] The `/ BC$/` arm rewrites the year and calls `super`; no wire-format
      parser is called from `oid/date-time.ts`.
- [ ] The `@missingRailsCall format — PERMANENT` receipt is gone, not reworded.
- [ ] The BC cases in
      `connection-adapters/postgresql/oid/date-time.trails.test.ts` and
      `adapters/postgresql/timestamp.test.ts` still pass, including year 0
      (1 BC), the leap-year case, and microsecond preservation.
