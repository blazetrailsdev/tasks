---
title: "Teach the call-arg comparator Ruby to_s and JS reserved-word locals"
status: done
updated: 2026-08-12
rfc: "0096-naming-identifier-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 90
priority: null
pr: 6391
claim: "2026-08-12T00:46:03Z"
assignee: "naming-comparator-to-s-and-reserved-word-residue"
blocked-by: null
closed-reason: null
---

## Context

RFC 0096's `naming` class cannot reach two families of rows, so the burndown
stories that own them can only report them, never converge them. Measured on
PR #6386 (merged): of the ~47 rows scoped to the PostgreSQL adapter, roughly
11 are in this shape, and every remaining wave-2 story will hit the same wall.
`naming-gate-flip` is explicitly blocked until the report shows "only the
tooling-shaped residue" — this story is what makes that residue identifiable
rather than indistinguishable from real port debt.

Both families live in `scripts/api-compare/call-args.ts`:

1. **`to_s` vs `toString`.** `normalizeRef` camelizes the Ruby name, so
   `old_name.to_s` records as `ref:toS`. `refKeysEqual` (call-args.ts:149-154)
   only consults `rubyMethodToTsIgnoringSkip` for names carrying `?` / `!` /
   `=`, so `toS` never compares equal to the TS `ref:toString` — nor to a bare
   string local, which is what the port usually passes because the value is
   already a string. Rails cites:
   `activerecord/lib/active_record/connection_adapters/postgresql/schema_statements.rb:436-437`
   (`clear_data_source_cache!(table_name.to_s)`), `:439` (`remove_index`'s
   `table_name.to_s`), `postgresql/quoting.rb` (`quote_string(value.to_s)`).

2. **Ruby names that are JS reserved words.** `default` and `null` cannot be
   TS identifiers, so the port spells them `default_` / `null_`, and
   `snakeToCamel("default_")` does not fold back to `default`. Rails cites:
   `postgresql/schema_statements.rb` (`extract_default_function(default_value, default)`),
   `abstract/schema_statements.rb` (`change_column_null(table_name, column_name, null, default)`).

## Acceptance criteria

- [ ] `refKeysEqual` (or an equivalent seam in `call-args.ts`) treats Ruby
      `to_s` as equal to TS `toString`, and to a TS `ref:` whose value the
      port already holds as a string, without collapsing genuine renames.
- [ ] A Ruby name that is a JS reserved word compares equal to the same name
      with a single trailing underscore. Restrict this to the actual reserved
      word list so it cannot absorb an unrelated `foo_` local.
- [ ] Unit tests in `scripts/api-compare/call-args.test.ts` cover both arms,
      including a negative case proving a real rename still reports.
- [ ] `API_COMPARE_FORCE=1 pnpm parity:api --calls` shows the `naming` count
      drop by the rows these two families account for, with no `shape` movement.
- [ ] `pnpm parity:api:calls` and `pnpm parity:api:calls:args` stay green.
