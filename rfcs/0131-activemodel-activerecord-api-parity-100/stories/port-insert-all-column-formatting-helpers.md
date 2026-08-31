---
title: "Extract insert_all's columns_list, format_columns and quote_columns instead of inlining the chain"
status: draft
updated: 2026-08-31
rfc: "0131-activemodel-activerecord-api-parity-100"
cluster: null
packages:
  - activerecord
deps: []
deps-rfc: []
est-loc: 190
priority: 3
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`insert_all.rb` sits at 43/46, missing `columns_list`, `format_columns` and
`quote_columns` on the `Builder` inner class.

Rails —
`vendor/rails/activerecord/lib/active_record/insert_all.rb:302-323`:

```ruby
def columns_list
  format_columns(insert_all.keys_including_timestamps)
end

def format_columns(columns)
  columns.respond_to?(:map) ? quote_columns(columns).join(",") : columns
end

def quote_columns(columns)
  columns.map { |column| quote_column(column) }
end
```

trails inlines the whole chain into one expression —
`packages/activerecord/src/insert-all.ts:537`, `const columnsList = keys.map((k)
=> this.quoteColumn(k)).join(",")` — so `columnsList` exists only as a local and
the two helpers do not exist at all. That is CLAUDE.md's "Decomposition" rule
exactly: if Rails extracts a private helper, extract it, with the Rails name.

The `respond_to?(:map)` arm is load-bearing and is not currently ported: Rails
passes `format_columns` through unchanged when it is handed something that is
not a collection. Port both arms.

`quote_column` (singular) already exists and is matched; only the three above
are missing.

## Acceptance criteria

- `columnsList`, `formatColumns` and `quoteColumns` are members of the
  `Builder` class in `insert-all.ts`, each `@internal` (all three are private
  in Rails), and the inline expression at `:537` is replaced by the call chain
  Rails writes.
- `formatColumns` ports both arms — the mapped-and-joined arm and the
  pass-through arm for a non-collection argument — and a test covers each.
- activerecord `insert_all.rb` reaches **46/46**; package total rises by 3.
- `pnpm parity:api:calls` and `:calls:args` clean — the point of the story is
  that the TS body starts making the calls the Ruby body makes.

## Definition of done

Porting only the mapped-and-joined arm does not close this story. Rails' `respond_to?(:map)` pass-through is a real branch and both arms need a test.

## Verification

```sh
pnpm build
API_COMPARE_FORCE=1 pnpm parity:api --package activerecord
pnpm parity:api:calls
pnpm parity:api:calls:args
pnpm parity:api:params
pnpm vitest run packages/activerecord/src/insert-all.test.ts
```

`parity:api:calls` is the real signal here — the point of the story is that the
TS body starts making the calls the Ruby body makes.
