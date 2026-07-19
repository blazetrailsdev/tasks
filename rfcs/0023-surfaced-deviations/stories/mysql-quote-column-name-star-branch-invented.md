---
title: "Remove the invented `*` branch from MySQL quoteColumnName"
status: draft
updated: 2026-07-19
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 20
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced while fixing #4974 (`quote-column-name-array-tos-formatting`).

`packages/activerecord/src/connection-adapters/mysql/quoting.ts:58-61` special-cases
`*`:

```ts
export function quoteColumnName(name: string): string {
  if (name === "*") return name;
  return `\`${name.replace(/`/g, "``")}\``;
}
```

Rails has no such branch. `mysql/quoting.rb:46-47` is unconditional:

```ruby
def quote_column_name(name)
  QUOTED_COLUMN_NAMES[name] ||= "`#{name.to_s.gsub('`', '``')}`".freeze
end
```

So Rails quotes `*` to `` `*` `` while trails returns it bare. The sibling
adapters agree with Rails — neither `sqlite3/quoting.ts` nor
`postgresql/quoting.ts` has a `*` branch — so this is a MySQL-only trails
invention.

Note the `*` handling that _does_ exist in Rails lives in the Arel visitor, not
the adapter: `to_sql.rb` renders a star projection as a `SqlLiteral`, which
never reaches `quote_column_name`. trails mirrors that at
`packages/arel/src/visitors/to-sql.ts:1350`
(`node.name === "*" ? "*" : this.quoteColumnName(node.name)`), which is why the
adapter-level branch is redundant as well as divergent.

## Scope

Delete the `*` branch from the MySQL adapter's `quoteColumnName`. Confirm the
visitor-level star handling covers every path that previously relied on it —
the risk is a caller that passes `"*"` straight to the adapter and would start
emitting `` `*` ``.

## Acceptance criteria

- `mysql/quoting.ts` `quoteColumnName` is unconditional, matching
  `mysql/quoting.rb:46-47`
- No caller regresses: a star projection still renders as bare `*`
- MySQL/MariaDB CI green
