---
title: "Retire selectListColumns / buildProjections onto build_select"
status: closed
updated: 2026-08-18
rfc: "0023-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: "Already converged: selectListColumns and buildProjections no longer exist anywhere in packages/ or scripts/; relation/query-methods.ts:3048 has buildSelect as the sole projection reader (query_methods.rb:1903-1911)."
---

## Context

`relation/query-methods.ts` carries `selectListColumns(host, model)` and
`buildProjections()` — neither has a Rails counterpart. Rails has exactly one
method here, `build_select(arel)` (query_methods.rb:1903-1911):

```ruby
def build_select(arel)
  if select_values.any?
    arel.project(*arel_columns(select_values))
  elsif model.ignored_columns.any? || model.enumerate_columns_in_select_statements
    arel.project(*model.column_names.map { |field| table[field] })
  else
    arel.project(table[Arel.star])
  end
end
```

PR #6587 (RFC 0106) converged `build_select` itself onto that body, which
retired its `select_values` / `arel_columns` / `ignored_columns` / `map`
call-set rows and left `selectListColumns` with exactly ONE remaining caller:
`buildProjections`, the trails-only projection reader for the legacy
`toArel`/`toSql` path. So the helper now exists solely to serve invented
surface.

`selectListColumns` also carries behaviour Rails has no branch for — it
prepends the primary key to `column_names` when absent, and falls back to the
star when the column list comes back empty. Both need a Rails cite or removal;
neither is in `build_select`.

## Acceptance criteria

- [ ] `buildProjections` is either removed (if the `toArel`/`toSql` path can
      read through `build_select`) or reduced to the Rails shape, with a
      `@noRailsEquivalent <reason>` tag if it genuinely must survive.
- [ ] `selectListColumns` is gone; the pk-prepend and empty-list fallback are
      either dropped or justified at the call site with a Rails cite.
- [ ] `pnpm parity:api:extra --package activerecord` shows fewer novel names in
      `relation/query-methods.ts` (12 novel at the time of filing).
- [ ] `pnpm parity:api:calls` / `:args` stay green with no new rows.
- [ ] SQLite, PostgreSQL and MySQL/MariaDB lanes green.
