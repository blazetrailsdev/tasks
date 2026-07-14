---
title: "quote-default-expression-serialize-and-default-prefix"
status: ready
updated: 2026-07-14
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rails' abstract `quote_default_expression`
(`vendor/rails/activerecord/lib/active_record/connection_adapters/abstract/quoting.rb:157-164`):

```ruby
def quote_default_expression(value, column) # :nodoc:
  if value.is_a?(Proc)
    value.call
  else
    value = lookup_cast_type(column.sql_type).serialize(value)
    quote(value)
  end
end
```

trails' (`packages/activerecord/src/connection-adapters/abstract/quoting.ts`)
diverges in two ways, both pre-dating and surfaced by review of #4870:

**1. It never serializes through the column's cast type.** The `_column`
parameter is unused — rb:161's
`lookup_cast_type(column.sql_type).serialize(value)` has no counterpart, so a
default reaches `quote` un-serialized. PG's own override _does_ serialize (via
its `typeMap` arg, `postgresql/quoting.ts`), so the abstract and PG paths
disagree about what `quote` receives. The gap is currently suppressed in
`scripts/api-compare/call-mismatches-wide-exclude.json` under the bulk RFC 0047
baseline ("baselined in bulk, NOT individually vetted") — a ratchet suppression,
not a convergence.

**2. It folds in the `DEFAULT` prefix, which Rails leaves to the caller.**
Rails' `add_column_options!`
(`abstract/schema_creation.rb:150`) writes
`sql << " DEFAULT #{quote_default_expression(options[:default], options[:column])}"`,
so `quote_default_expression` returns the **bare** literal. trails' abstract and
PG implementations return `" DEFAULT <literal>"`, while **SQLite's returns the
bare literal** (`sqlite3/quoting.ts`) — so the three are mutually inconsistent
today, and any caller has to know which dialect it holds. Note the trails
signature also takes `(value, column, typeMap)` on PG vs Rails' `(value, column)`.

Neither is a live bug: the schema-creation callers are matched to whichever
shape their adapter returns. It is a contract divergence that makes the abstract
method non-substitutable for Rails' and keeps the wide ratchet suppressed.

## Acceptance criteria

- [ ] Abstract `quoteDefaultExpression` serializes via the column's cast type,
      mirroring rb:161 (`lookup_cast_type(column.sql_type).serialize(value)`),
      rather than ignoring `_column`.
- [ ] Decide and apply one `DEFAULT` contract across abstract + PG + SQLite —
      Rails' is bare-literal-out, prefix owned by `add_column_options!`
      (`abstract/schema_creation.rb:150`). Update the schema-creation callers to
      match whichever way it lands, and land all three together (a half-migration
      emits `DEFAULT DEFAULT x` or drops the keyword).
- [ ] Drop the now-unnecessary `quote_default_expression`/`serialize` entry from
      `scripts/api-compare/call-mismatches-wide-exclude.json` if the port
      satisfies it; the `quote` and `call` entries stay (dispatchQuote
      indirection / Rails' `value.call` has no TS token counterpart).
- [ ] Schema dumps and `add_column_options!` output unchanged on all three
      adapters (this is a refactor of where the prefix lives, not of emitted SQL).
- [ ] api:compare / test:compare delta non-negative.
