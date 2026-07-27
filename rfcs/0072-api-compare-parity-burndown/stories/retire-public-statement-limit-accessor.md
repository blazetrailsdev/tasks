---
title: "retire-public-statement-limit-accessor"
status: ready
updated: 2026-07-27
rfc: "0072-api-compare-parity-burndown"
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

Found by the `@noRailsEquivalent` tag audit (RFC 0080). Three adapters carry a
public validated `statementLimit` accessor tagged as having no Rails
equivalent:

- `connection-adapters/abstract-mysql-adapter.ts:283`
- `connection-adapters/postgresql-adapter.ts:533`
- `connection-adapters/sqlite3-adapter.ts:345`

The tag is accurate that Rails has no `def statement_limit`, but it is not a
permanent language fact. Rails reads the value inline, exactly once per
adapter, at `StatementPool` construction:

- `abstract_mysql_adapter.rb:975`
- `postgresql_adapter.rb:1056`
- `sqlite3_adapter.rb:803`

each spelled
`StatementPool.new(self.class.type_cast_config_to_integer(@config[:statement_limit]))`.
`statement_limit` is a `database.yml` config key, never public adapter API.
The trails accessor is an invented public surface that a port can remove.

## Acceptance criteria

- Read the config inline at the `StatementPool` construction site in each of
  the three adapters, matching the Rails shape above.
- Delete the public `statementLimit` accessor from all three adapters, along
  with its `@noRailsEquivalent` tag.
- If a caller outside the pool construction genuinely needs the value, keep it
  as a `_`-prefixed or `@internal` member and record the caller at the
  declaration — do not keep a public accessor.
- `pnpm api:extra --package activerecord` reports no stale tags and does not
  regress the three adapter files above their current novel counts.
