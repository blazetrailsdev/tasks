---
title: "six pg schema-statements call rows are Ruby builtins spelled ad-hoc in JS"
status: in-progress
updated: 2026-09-05
rfc: "0119-connection-adapter-fidelity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 90
priority: null
pr: 7531
claim: "2026-09-05T19:26:47Z"
assignee: "port-actionview-cache-helper"
blocked-by: null
closed-reason: null
---

## Context

PR #7247 folded `postgresql/schema-statements-class.ts` back into
`postgresql/schema-statements.ts`, which paired the file with
`vendor/rails/activerecord/lib/active_record/connection_adapters/postgresql/schema_statements.rb`
for the first time and so measured its call set for the first time. Twelve
mismatches surfaced; five were real and were converged in that PR. Six remain,
baselined in
`scripts/api-compare/call-mismatches-exclude/activerecord/connection-adapters/postgresql/schema-statements.json`
with a per-row reason naming its Rails line. Each is a Ruby builtin with no JS
counterpart — a burndown ledger row, not a settled decision:

| Ruby method                        | Rails      | Ruby builtin                                         |
| ---------------------------------- | ---------- | ---------------------------------------------------- |
| `column_names_from_column_numbers` | `:1153`    | `Hash#values_at(*column_numbers)`                    |
| `columns_for_distinct`             | `:869-876` | `compact_blank.map{}.compact_blank.map.with_index{}` |
| `exclusion_constraint_name`        | `:1082`    | `String#first(10)`                                   |
| `unique_constraint_name`           | `:1102`    | `String#first(10)`                                   |
| `unique_constraint_name`           | `:1100`    | `Array(...).map(&:to_s)`                             |
| `unique_constraints`               | `:709`     | `String#delete("{}")`                                |

`columns_for_distinct` is the one worth real attention: the port interleaves a
`filter` between the two `map`s because JS has no `compact_blank`, so the call
ORDER differs from Rails' even though the produced list does not.

## Converged shape

Per row, reach for the ActiveSupport / ruby-compat analogue trails already has
rather than an ad-hoc JS spelling, and delete the baseline row — the baseline is
only-shrink, so each conversion is a hand-deleted row plus
`pnpm parity:api:calls:tighten activerecord/connection-adapters/postgresql/schema-statements.json`.

`compact_blank` in particular has an ActiveSupport counterpart in this repo;
using it would restore Rails' `map`/`compact_blank`/`map.with_index` call
sequence in `columns_for_distinct` exactly. Check `@blazetrails/ruby-compat` for
a `String#first` / `Hash#values_at` before hand-rolling `slice`.

Do not reword or broaden the six reasons — a row converges by deletion.

## Acceptance criteria

- [ ] Each of the six rows is either converged (row deleted, mark tightened) or,
      where no ActiveSupport/ruby-compat analogue exists, left with its existing
      reason untouched and the reason why recorded here.
- [ ] `columns_for_distinct` calls what `schema_statements.rb:869-876` calls, in
      that order.
- [ ] `pnpm parity:api:calls` and `pnpm parity:api:calls:args` clean; the
      baseline row count for this file moves DOWN, never up.
- [ ] PostgreSQL lane green.
