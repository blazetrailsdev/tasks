---
title: "call-arg comparator cannot pair a Ruby .to_s receiver, stranding ~10 adapter naming rows"
status: draft
updated: 2026-08-11
rfc: "0023-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 100
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

RFC 0095's call-argument comparator cannot pair a Ruby `.to_s` receiver against
any TS spelling, so a family of adapter rows is structurally unconvergeable
today. Rails writes:

```ruby
schema_cache.clear_data_source_cache!(table_name.to_s)   # sqlite3_adapter.rb#rename_table
index_name_for_remove(table.to_s, column_name, options)  # postgresql/schema_statements.rb:559
```

The extractor records the argument by its trailing call, i.e. `ref:toS`.
`refKeysEqual` (`scripts/api-compare/call-args.ts:144-149`) only bridges Ruby
names ending in `?`/`!`/`=` through `rubyMethodToTsIgnoringSkip`, so `ref:toS`
matches neither `ref:tableName` (the port passing the value directly) nor
`ref:toString` (a port spelling the conversion out). Roughly ten `naming` rows
across the rename/index methods in `postgresql-adapter.ts`,
`abstract-mysql-adapter.ts`, `sqlite3-adapter.ts`, and
`abstract/schema-statements.ts` are in this class; PR #6353 measured them and
left every one, since no rename can clear them.

## Converged shape

Decide and implement the pairing rule in the comparator, then re-measure:

- If trails treats Ruby `to_s` on an already-String value as a no-op (the
  position these call sites take today), teach `normalizeRef` /
  `refKeysEqual` to unwrap a `ref:toS` receiver to the receiver's own name, so
  Rails' `table_name.to_s` pairs with the port's `tableName`.
- If instead the port should spell the conversion, add `to_s` → `toString` to
  the bridged-name table so `ref:toS` pairs with `ref:toString`, and converge
  the call sites to `String(...)` / `.toString()`.

The first is almost certainly right — Ruby's `to_s` here normalizes a Symbol
argument, which a TS caller cannot pass — but it is a comparator change that
moves the measured population, so it needs its own measured PR the way
`align-collect-calls-name-filter-with-ruby` does.

## Acceptance criteria

1. The chosen rule is implemented in `scripts/api-compare/call-args.ts` with
   the Ruby citation, and unit-tested both ways (a genuine argument change must
   still flag).
2. The `naming` row movement is reported before/after; no row is baselined to
   make the gate green.
3. If the second option is chosen, the affected adapter call sites are
   converged in the same pass.
