---
title: "arel-visitor-to-s-belongs-in-adapter-quoting"
status: closed
updated: 2026-08-18
rfc: "0023-surfaced-deviations"
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
closed-reason: "merged into to-sql-quote-name-routes-through-invented-rubytos — duplicate: both are the same two naming rows on packages/arel/src/visitors/to-sql.ts (quote_table_name / quote_column_name passing through the invented rubyToS helper)"
---

## Context

Surfaced by `converge-to-sql-visitor-call-arguments` (RFC 0099), which converged
nine of the ten `naming` rows on `packages/arel/src/visitors/to-sql.ts` and left
these two:

```text
quote_table_name  -> quote_table_name   ruby: [ref:name]  ts: [call:rubyToS]
quote_column_name -> quote_column_name  ruby: [ref:name]  ts: [call:rubyToS]
```

Rails (`vendor/rails/activerecord/lib/arel/visitors/to_sql.rb:872-878`) passes
the name straight through:

```ruby
def quote_table_name(name)
  return name if Arel::Nodes::SqlLiteral === name
  @connection.quote_table_name(name)
end
```

The `to_s` Rails applies lives one layer down, in EVERY adapter's quoting
module — `quote_table_name(name)` is `"#{name.to_s}"`-shaped at
`sqlite3/quoting.rb:45`, `mysql/quoting.rb:47`, `postgresql/quoting.rb:47`.

trails hoists it into the visitor (`rubyToS(name)`, to-sql.ts:116) because the
`Connection` quoting surface is typed `quoteTableName(name: string)`, so the
visitor is the last place a non-String name (a Symbol, or the Array an
Attribute carries on the composite-primary-key default-order path) can be
coerced. That is a real behavioural dependency, not dead code — `rubyToS` also
reproduces Ruby's inspect-style `Array#to_s`, which JS's comma join does not —
so it was NOT absorbed into the converging PR.

## Acceptance criteria

- [ ] `quote_table_name` / `quote_column_name` in `to-sql.ts` pass `name`
      through, as Rails does.
- [ ] The `to_s` moves to where Rails has it: each adapter's `quoteTableName` /
      `quoteColumnName` (sqlite3, mysql, postgresql, and the abstract quoting
      interface), whose parameter widens from `string` to what Rails accepts.
- [ ] The Array arm keeps rendering inspect-style, with a test covering the
      composite-primary-key `table[primaryKey].desc` path that motivated it.
- [ ] The two `naming` rows leave `pnpm parity:api:calls:args:report`; arel and
      adapter quoting tests green on all three adapters.
