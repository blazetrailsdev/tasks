---
title: "Port PG quote_default_expression uuid function-default branch + converge array lookup"
status: done
updated: 2026-07-19
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: 4953
claim: "2026-07-19T14:01:17Z"
assignee: "pg-quote-default-expression-uuid-fn-branch"
blocked-by: null
closed-reason: null
---

## Context

Surfaced by review of #4934 (`quote-default-expression-serialize-and-default-prefix`),
which converged the abstract/SQLite `quote_default_expression` onto Rails but
left PostgreSQL's port incomplete.

Rails' PG `quote_default_expression`
(`vendor/rails/activerecord/lib/active_record/connection_adapters/postgresql/quoting.rb:156-167`):

```ruby
def quote_default_expression(value, column) # :nodoc:
  if value.is_a?(Proc)
    value.call
  elsif column.type == :uuid && value.is_a?(String) && value.include?("()")
    value # Does not quote function default values for UUID columns
  elsif column.respond_to?(:array?)
    type = lookup_cast_type_from_column(column)
    quote(type.serialize(value))
  else
    super
  end
end
```

trails' port (`packages/activerecord/src/connection-adapters/postgresql/quoting.ts:154`)
is **missing the uuid function-default branch** (rb:159-160): a string default
containing `()` on a `:uuid` column must pass through **bare**, but trails routes
it through the array/else path and quotes it as a string literal. So
`change_column_default(:t, :id, "uuid_generate_v4()")` on a uuid column emits
`SET DEFAULT 'uuid_generate_v4()'` (a literal) instead of the bare function call
`SET DEFAULT uuid_generate_v4()`. (The CREATE-time uuid-PK `gen_random_uuid()`
default is special-cased separately in pg `addColumnOptionsBang`, so this gap is
only reachable via user-supplied uuid function defaults / change_column_default.)

The array branch also diverges: Rails calls `lookup_cast_type_from_column(column)`
whereas trails threads a bespoke `typeMap.lookup(...)` closure. These two gaps
are why the wide-ratchet still suppresses `quote_default_expression`/`include?`
and `quote_default_expression`/`lookup_cast_type_from_column` in
`scripts/api-compare/call-mismatches-wide-exclude/activerecord/connection-adapters/postgresql/quoting.json`
("Baseline RFC 0047, NOT individually vetted").

## Acceptance criteria

- [ ] Port the uuid function-default branch (rb:159-160): a `:uuid` column with a
      string default containing `()` returns the value bare (no quoting), matching
      Rails' "Does not quote function default values for UUID columns".
- [ ] Converge the array branch to `lookupCastTypeFromColumn(column)` (rb:161-163)
      rather than the bespoke `typeMap.lookup` closure, if behavior-equivalent.
- [ ] Add a test: `change_column_default` (or DDL) on a PG uuid column with
      `"uuid_generate_v4()"` emits the bare function call, not a quoted literal.
- [ ] Drop the now-satisfied `quote_default_expression`/`include?` (and, if the
      array-branch converges, `/lookup_cast_type_from_column`) entries from the
      PG wide-call exclude.
- [ ] api:compare / test:compare delta non-negative.
